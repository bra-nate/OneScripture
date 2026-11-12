import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { type PassageRef } from "@/lib/bible/reference";
import { normalizeScriptureSelection } from "@/lib/scripture/selections";
import { type CanonicalPassage } from "@/lib/scripture/types";

const EXPECTED_TRANSLATIONS = {
  WEB: {
    count: 31_103,
    hash: "f08d13b4f0701108f7b9f95d57c201649f37c36359f707c8cf1876538a84d750",
    name: "World English Bible",
  },
  KJV: {
    count: 31_102,
    hash: "ee4cae32cddded36d9dfcb524c70c03dcf930cf04924ca34c9b805bac39210d4",
    name: "King James Version",
  },
  ASV: {
    count: 31_102,
    hash: "6c41b8020cba9cf7041689f2356c55859e28023405537388be08bad93df2b050",
    name: "American Standard Version",
  },
} as const;

interface TranslationRow {
  id: string;
  code: string;
  source_artifact_sha256: string;
  can_display_text: boolean;
  can_generate_audio: boolean;
  can_stream_audio: boolean;
}

interface VerseRow {
  id: number;
  translation_id: string;
  book_id: string;
  chapter: number;
  verse: number;
  text: string;
  text_hash: string;
}

interface ScriptureDatabase {
  public: {
    Tables: {
      scripture_translations: {
        Row: TranslationRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      scripture_verses: {
        Row: VerseRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

function requireEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main(): Promise<void> {
  const requestedCode = process.argv
    .find((argument) => argument.startsWith("--translation="))
    ?.split("=", 2)[1]
    ?.toUpperCase() as keyof typeof EXPECTED_TRANSLATIONS | undefined;
  const code = requestedCode ?? "WEB";
  const expected = EXPECTED_TRANSLATIONS[code];
  if (!expected) throw new Error("Choose --translation=WEB, KJV, or ASV");
  const supabase = createClient<ScriptureDatabase>(
    requireEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: translation, error: translationError } = await supabase
    .from("scripture_translations")
    .select(
      "id, code, source_artifact_sha256, can_display_text, can_generate_audio, can_stream_audio",
    )
    .eq("code", code)
    .single<TranslationRow>();

  if (translationError || !translation) {
    throw new Error(
      `${code} translation is unavailable: ${translationError?.message ?? "missing row"}`,
    );
  }
  if (translation.source_artifact_sha256 !== expected.hash) {
    throw new Error(`${code} source artifact hash does not match the approved pin`);
  }
  if (
    !translation.can_display_text ||
    !translation.can_generate_audio ||
    !translation.can_stream_audio
  ) {
    throw new Error(`${code} capability flags are incomplete`);
  }

  const { count, error: countError } = await supabase
    .from("scripture_verses")
    .select("id", { count: "exact", head: true })
    .eq("translation_id", translation.id);
  if (countError || count !== expected.count) {
    throw new Error(
      `Expected ${expected.count} public ${code} verses, received ${count ?? "unknown"}`,
    );
  }

  await verifyPassage(supabase, translation.id, "JHN", 3, 16, 16, 1);
  await verifyPassage(supabase, translation.id, "JHN", 3, 16, 18, 3);
  await verifyPassage(supabase, translation.id, "PSA", 23, 1, 6, 6);
  await verifyPassage(supabase, translation.id, "JHN", 22, 1, 200, 0);
  await verifyPassage(supabase, translation.id, "JHN", 3, 999, 999, 0);

  const selection = await normalizeScriptureSelection(
    ["John 3:16-17", "Psalms 23:1", "John 3:17"],
    code,
    createPassageResolver(supabase, translation.id, code, expected.name),
  );
  const orderedReferences = selection.verses.map(
    (verse) => `${verse.bookId} ${verse.chapter}:${verse.verse}`,
  );
  const expectedReferences = ["JHN 3:16", "JHN 3:17", "PSA 23:1"];
  if (orderedReferences.join("|") !== expectedReferences.join("|")) {
    throw new Error(
      `Multi-reference order mismatch: received ${orderedReferences.join(", ")}`,
    );
  }

  console.log(`Verified ${code} translation rights and source pin.`);
  console.log(`Verified ${expected.count} public canonical verses.`);
  console.log("Verified chapter, single-verse, range, and missing-reference reads.");
  console.log("Verified ordered multi-reference normalization and duplicate removal.");
}

function createPassageResolver(
  supabase: SupabaseClient<ScriptureDatabase>,
  translationId: string,
  translationCode: string,
  translationName: string,
) {
  return async (reference: PassageRef): Promise<CanonicalPassage> => {
    let query = supabase
      .from("scripture_verses")
      .select("id, translation_id, book_id, chapter, verse, text, text_hash")
      .eq("translation_id", translationId)
      .eq("book_id", reference.bookId)
      .eq("chapter", reference.chapter);

    if (reference.verseStart !== null) {
      query = query
        .gte("verse", reference.verseStart)
        .lte("verse", reference.verseEnd ?? reference.verseStart);
    }

    const { data, error } = await query
      .order("verse", { ascending: true })
      .returns<VerseRow[]>();
    if (error || !data?.length) {
      throw new Error(
        `Unable to resolve ${reference.bookId} ${reference.chapter}: ${error?.message ?? "missing passage"}`,
      );
    }

    return {
      reference,
      translation: {
        id: translationId,
        code: translationCode,
        name: translationName,
        languageCode: "eng",
        sourceName: "eBible.org",
        sourceVersion: "2020 stable text edition",
        attribution: "World English Bible — Public Domain; source: eBible.org",
        canGenerateAudio: true,
        canStreamAudio: true,
      },
      verses: data.map((verse) => ({
        id: verse.id,
        translationId: verse.translation_id,
        bookId: verse.book_id,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
        textHash: verse.text_hash,
      })),
    };
  };
}

async function verifyPassage(
  supabase: SupabaseClient<ScriptureDatabase>,
  translationId: string,
  bookId: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
  expectedCount: number,
): Promise<void> {
  const { data, error } = await supabase
    .from("scripture_verses")
    .select("id, translation_id, book_id, chapter, verse, text, text_hash")
    .eq("translation_id", translationId)
    .eq("book_id", bookId)
    .eq("chapter", chapter)
    .gte("verse", verseStart)
    .lte("verse", verseEnd)
    .order("verse", { ascending: true })
    .returns<VerseRow[]>();

  if (error) {
    throw new Error(
      `Unable to verify ${bookId} ${chapter}:${verseStart}-${verseEnd}: ${error.message}`,
    );
  }
  if ((data?.length ?? 0) !== expectedCount) {
    throw new Error(
      `${bookId} ${chapter}:${verseStart}-${verseEnd} returned ${data?.length ?? 0} verses; expected ${expectedCount}`,
    );
  }

  for (const verse of data ?? []) {
    if (!verse.text_hash.match(/^[0-9a-f]{64}$/u)) {
      throw new Error(`${bookId} ${chapter}:${verse.verse} has an invalid text hash`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown verification failure");
  process.exitCode = 1;
});
