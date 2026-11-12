import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import { BIBLE_BOOKS } from "@/lib/bible/reference";

const IMPORT_BATCH_SIZE = 500;

interface TranslationSource {
  archiveEntry: string;
  archiveName: string;
  archiveSha256: string;
  attribution: string;
  code: "ASV" | "KJV" | "WEB";
  expectedEmptyVerseCount: number;
  expectedVerseCount: number;
  name: string;
  rightsUrl: string;
  sourceId: string;
  sourcePublishedAt: string | null;
  sourceUrl: string;
  sourceVersion: string;
}

const TRANSLATION_SOURCES: Readonly<Record<TranslationSource["code"], TranslationSource>> = {
  WEB: {
    archiveEntry: "engwebp_vpl.txt",
    archiveName: "engwebp_vpl.zip",
    archiveSha256: "f08d13b4f0701108f7b9f95d57c201649f37c36359f707c8cf1876538a84d750",
    attribution: "World English Bible — Public Domain; source: eBible.org",
    code: "WEB",
    expectedEmptyVerseCount: 5,
    expectedVerseCount: 31_103,
    name: "World English Bible",
    rightsUrl: "https://ebible.org/engwebp/copyright.htm",
    sourceId: "engwebp",
    sourcePublishedAt: "2026-08-26",
    sourceUrl: "https://ebible.org/engwebp/",
    sourceVersion: "2020 stable text edition",
  },
  KJV: {
    archiveEntry: "eng-kjv2006_vpl.txt",
    archiveName: "eng-kjv2006_vpl.zip",
    archiveSha256: "ee4cae32cddded36d9dfcb524c70c03dcf930cf04924ca34c9b805bac39210d4",
    attribution: "King James Version — Public Domain outside the United Kingdom; source: eBible.org",
    code: "KJV",
    expectedEmptyVerseCount: 0,
    expectedVerseCount: 31_102,
    name: "King James Version",
    rightsUrl: "https://ebible.org/find/details.php?id=eng-kjv2006",
    sourceId: "eng-kjv2006",
    sourcePublishedAt: null,
    sourceUrl: "https://ebible.org/eng-kjv2006/",
    sourceVersion: "2017 eBible edition",
  },
  ASV: {
    archiveEntry: "eng-asv_vpl.txt",
    archiveName: "eng-asv_vpl.zip",
    archiveSha256: "6c41b8020cba9cf7041689f2356c55859e28023405537388be08bad93df2b050",
    attribution: "American Standard Version — Public Domain; source: eBible.org",
    code: "ASV",
    expectedEmptyVerseCount: 16,
    expectedVerseCount: 31_102,
    name: "American Standard Version",
    rightsUrl: "https://ebible.org/find/details.php?id=eng-asv",
    sourceId: "eng-asv",
    sourcePublishedAt: null,
    sourceUrl: "https://ebible.org/eng-asv/",
    sourceVersion: "1901 edition",
  },
};

const SOURCE_BOOK_ID_MAP: Readonly<Record<string, string>> = {
  SOL: "SNG",
  EZE: "EZK",
  JOE: "JOL",
  NAH: "NAM",
  MAR: "MRK",
  JOH: "JHN",
  PHI: "PHP",
  JAM: "JAS",
  "1JO": "1JN",
  "2JO": "2JN",
  "3JO": "3JN",
};

interface ImportVerse {
  book_id: string;
  chapter: number;
  verse: number;
  text: string;
  text_hash: string;
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function readPinnedSource(source: TranslationSource): string {
  const archivePath = path.resolve(
    process.cwd(),
    `.cache/scripture-sources/${source.archiveName}`,
  );
  const archive = readFileSync(archivePath);
  const archiveHash = sha256(archive);
  if (archiveHash !== source.archiveSha256) {
    throw new Error(
      `Source archive hash mismatch: expected ${source.archiveSha256}, received ${archiveHash}`,
    );
  }

  const result = spawnSync("unzip", ["-p", archivePath, source.archiveEntry], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || "Unable to read the VPL source archive");
  }
  return result.stdout;
}

function parseVerseLine(line: string, lineNumber: number): ImportVerse {
  const match = line.match(/^([1-3]?[A-Z]{2,3}) (\d+):(\d+) (.*)$/u);
  if (!match) throw new Error(`Invalid VPL record on line ${lineNumber}`);

  const [, sourceBookId, chapterValue, verseValue, text] = match;
  const bookId = SOURCE_BOOK_ID_MAP[sourceBookId] ?? sourceBookId;
  return {
    book_id: bookId,
    chapter: Number(chapterValue),
    verse: Number(verseValue),
    text,
    text_hash: sha256(text),
  };
}

function parseCatalogue(sourceText: string, source: TranslationSource): ImportVerse[] {
  const lines = sourceText.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
  const verses = lines.map((line, index) => parseVerseLine(line, index + 1));
  const expectedBooks = new Set(BIBLE_BOOKS.map((book) => book.id));
  const importedBooks = new Set(verses.map((verse) => verse.book_id));
  const references = new Set(
    verses.map((verse) => `${verse.book_id}:${verse.chapter}:${verse.verse}`),
  );

  if (verses.length !== source.expectedVerseCount) {
    throw new Error(
      `Expected ${source.expectedVerseCount} verses, received ${verses.length}`,
    );
  }
  if (importedBooks.size !== expectedBooks.size) {
    throw new Error(
      `Expected ${expectedBooks.size} books, received ${importedBooks.size}`,
    );
  }
  for (const bookId of expectedBooks) {
    if (!importedBooks.has(bookId)) throw new Error(`Missing canonical book ${bookId}`);
  }
  if (references.size !== verses.length) {
    throw new Error("The source contains duplicate verse references");
  }
  const emptyVerseCount = verses.filter((verse) => verse.text.length === 0).length;
  if (emptyVerseCount !== source.expectedEmptyVerseCount) {
    throw new Error(
      `Expected ${source.expectedEmptyVerseCount} empty verse markers, received ${emptyVerseCount}`,
    );
  }

  return verses;
}

async function applyCatalogue(source: TranslationSource, verses: ImportVerse[]): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --apply",
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: translation, error: translationError } = await supabase
    .from("scripture_translations")
    .upsert(
      {
        code: source.code,
        name: source.name,
        language_code: "eng",
        source_id: source.sourceId,
        source_name: "eBible.org",
        source_version: source.sourceVersion,
        source_url: source.sourceUrl,
        source_artifact_sha256: source.archiveSha256,
        source_published_at: source.sourcePublishedAt,
        rights_url: source.rightsUrl,
        attribution: source.attribution,
        can_display_text: true,
        can_generate_audio: true,
        can_stream_audio: true,
        can_cache_offline: true,
        can_download_audio: true,
      },
      { onConflict: "code" },
    )
    .select("id")
    .single<{ id: string }>();

  if (translationError || !translation) {
    throw new Error(
      `Unable to upsert ${source.code} translation: ${translationError?.message ?? "missing row"}`,
    );
  }

  for (let offset = 0; offset < verses.length; offset += IMPORT_BATCH_SIZE) {
    const batch = verses.slice(offset, offset + IMPORT_BATCH_SIZE).map((verse) => ({
      ...verse,
      translation_id: translation.id,
    }));
    const { error } = await supabase.from("scripture_verses").upsert(batch, {
      onConflict: "translation_id,book_id,chapter,verse",
    });
    if (error) {
      throw new Error(
        `Verse import failed at row ${offset + 1}: ${error.message}`,
      );
    }
  }

  const { count, error: countError } = await supabase
    .from("scripture_verses")
    .select("id", { count: "exact", head: true })
    .eq("translation_id", translation.id);
  if (countError || count !== source.expectedVerseCount) {
    throw new Error(
      `Import verification failed: expected ${source.expectedVerseCount}, received ${count ?? "unknown"}`,
    );
  }
}

async function main(): Promise<void> {
  const shouldApply = process.argv.includes("--apply");
  const requestedCode = process.argv
    .find((argument) => argument.startsWith("--translation="))
    ?.split("=", 2)[1]
    ?.toUpperCase() as TranslationSource["code"] | undefined;
  const source = TRANSLATION_SOURCES[requestedCode ?? "WEB"];
  if (!source) {
    throw new Error("Choose --translation=WEB, --translation=KJV, or --translation=ASV");
  }
  const verses = parseCatalogue(readPinnedSource(source), source);
  const first = verses[0];
  const last = verses.at(-1);

  console.log(`Translation: ${source.code} — ${source.name}`);
  console.log(`Source SHA-256: ${source.archiveSha256}`);
  console.log(`Validated books: ${new Set(verses.map((verse) => verse.book_id)).size}`);
  console.log(`Validated verses: ${verses.length}`);
  console.log(`Empty verse markers preserved: ${source.expectedEmptyVerseCount}`);
  console.log(`Canonical range: ${first.book_id} ${first.chapter}:${first.verse} → ${last?.book_id} ${last?.chapter}:${last?.verse}`);
  console.log(`John 3:16 hash: ${verses.find((verse) => verse.book_id === "JHN" && verse.chapter === 3 && verse.verse === 16)?.text_hash}`);

  if (!shouldApply) {
    console.log("Dry run complete. Pass --apply only after migration 0002 is installed.");
    return;
  }

  await applyCatalogue(source, verses);
  console.log(`Applied and verified ${verses.length} ${source.code} verses.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown import failure");
  process.exitCode = 1;
});
