import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import { BIBLE_BOOKS } from "@/lib/bible/reference";

const ARCHIVE_PATH = path.resolve(
  process.cwd(),
  ".cache/scripture-sources/engwebp_vpl.zip",
);
const ARCHIVE_ENTRY = "engwebp_vpl.txt";
const ARCHIVE_SHA256 =
  "f08d13b4f0701108f7b9f95d57c201649f37c36359f707c8cf1876538a84d750";
const EXPECTED_VERSE_COUNT = 31_103;
const EXPECTED_EMPTY_VERSE_COUNT = 5;
const IMPORT_BATCH_SIZE = 500;

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

function readPinnedSource(): string {
  const archive = readFileSync(ARCHIVE_PATH);
  const archiveHash = sha256(archive);
  if (archiveHash !== ARCHIVE_SHA256) {
    throw new Error(
      `Source archive hash mismatch: expected ${ARCHIVE_SHA256}, received ${archiveHash}`,
    );
  }

  const result = spawnSync("unzip", ["-p", ARCHIVE_PATH, ARCHIVE_ENTRY], {
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

function parseCatalogue(source: string): ImportVerse[] {
  const lines = source.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
  const verses = lines.map((line, index) => parseVerseLine(line, index + 1));
  const expectedBooks = new Set(BIBLE_BOOKS.map((book) => book.id));
  const importedBooks = new Set(verses.map((verse) => verse.book_id));
  const references = new Set(
    verses.map((verse) => `${verse.book_id}:${verse.chapter}:${verse.verse}`),
  );

  if (verses.length !== EXPECTED_VERSE_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_VERSE_COUNT} verses, received ${verses.length}`,
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
  if (emptyVerseCount !== EXPECTED_EMPTY_VERSE_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_EMPTY_VERSE_COUNT} empty verse markers, received ${emptyVerseCount}`,
    );
  }

  return verses;
}

async function applyCatalogue(verses: ImportVerse[]): Promise<void> {
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
        code: "WEB",
        name: "World English Bible",
        language_code: "eng",
        source_id: "engwebp",
        source_name: "eBible.org",
        source_version: "2020 stable text edition",
        source_url: "https://ebible.org/engwebp/",
        source_artifact_sha256: ARCHIVE_SHA256,
        source_published_at: "2026-08-26",
        rights_url: "https://ebible.org/engwebp/copyright.htm",
        attribution: "World English Bible — Public Domain; source: eBible.org",
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
      `Unable to upsert WEB translation: ${translationError?.message ?? "missing row"}`,
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
  if (countError || count !== EXPECTED_VERSE_COUNT) {
    throw new Error(
      `Import verification failed: expected ${EXPECTED_VERSE_COUNT}, received ${count ?? "unknown"}`,
    );
  }
}

async function main(): Promise<void> {
  const shouldApply = process.argv.includes("--apply");
  const verses = parseCatalogue(readPinnedSource());
  const first = verses[0];
  const last = verses.at(-1);

  console.log(`Source SHA-256: ${ARCHIVE_SHA256}`);
  console.log(`Validated books: ${new Set(verses.map((verse) => verse.book_id)).size}`);
  console.log(`Validated verses: ${verses.length}`);
  console.log(`Empty verse markers preserved: ${EXPECTED_EMPTY_VERSE_COUNT}`);
  console.log(`Canonical range: ${first.book_id} ${first.chapter}:${first.verse} → ${last?.book_id} ${last?.chapter}:${last?.verse}`);
  console.log(`John 3:16 hash: ${verses.find((verse) => verse.book_id === "JHN" && verse.chapter === 3 && verse.verse === 16)?.text_hash}`);

  if (!shouldApply) {
    console.log("Dry run complete. Pass --apply only after migration 0002 is installed.");
    return;
  }

  await applyCatalogue(verses);
  console.log(`Applied and verified ${verses.length} WEB verses.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown import failure");
  process.exitCode = 1;
});
