import "server-only";

import { type PassageRef } from "@/lib/bible/reference";
import { ScriptureError } from "@/lib/scripture/errors";
import { expectedVerseCount, validatePassageReference } from "@/lib/scripture/passages";
import { type CanonicalPassage, type ScriptureTranslation, type ScriptureVerse } from "@/lib/scripture/types";
import { createClient } from "@/lib/supabase/server";

interface TranslationRow {
  id: string;
  code: string;
  name: string;
  language_code: string;
  source_name: string;
  source_version: string;
  attribution: string;
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

export async function getCanonicalPassage(
  reference: PassageRef,
  translationCode = "WEB",
): Promise<CanonicalPassage> {
  validatePassageReference(reference);

  const supabase = await createClient();
  const { data: translations, error: translationError } = await supabase
    .from("scripture_translations")
    .select(
      "id, code, name, language_code, source_name, source_version, attribution, can_generate_audio, can_stream_audio",
    )
    .eq("code", translationCode)
    .eq("can_display_text", true)
    .limit(1)
    .returns<TranslationRow[]>();

  if (translationError) {
    throw new ScriptureError(
      "catalogue_unavailable",
      "The scripture catalogue is not available yet.",
    );
  }

  const translationRow = translations?.[0];
  if (!translationRow) {
    throw new ScriptureError(
      "passage_not_found",
      `Translation ${translationCode} is not available.`,
    );
  }

  let versesQuery = supabase
    .from("scripture_verses")
    .select("id, translation_id, book_id, chapter, verse, text, text_hash")
    .eq("translation_id", translationRow.id)
    .eq("book_id", reference.bookId)
    .eq("chapter", reference.chapter);

  if (reference.verseStart !== null) {
    versesQuery = versesQuery.gte("verse", reference.verseStart);
    versesQuery = versesQuery.lte(
      "verse",
      reference.verseEnd ?? reference.verseStart,
    );
  }

  const { data: verseRows, error: versesError } = await versesQuery
    .order("verse", { ascending: true })
    .returns<VerseRow[]>();

  if (versesError) {
    throw new ScriptureError(
      "catalogue_unavailable",
      "The scripture passage could not be loaded.",
    );
  }

  const expectedCount = expectedVerseCount(reference);
  if (
    !verseRows?.length ||
    (expectedCount !== null && verseRows.length !== expectedCount)
  ) {
    throw new ScriptureError(
      "passage_not_found",
      "The requested scripture reference does not exist.",
    );
  }

  return {
    reference,
    translation: mapTranslation(translationRow),
    verses: verseRows.map(mapVerse),
  };
}

function mapTranslation(row: TranslationRow): ScriptureTranslation {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    languageCode: row.language_code,
    sourceName: row.source_name,
    sourceVersion: row.source_version,
    attribution: row.attribution,
    canGenerateAudio: row.can_generate_audio,
    canStreamAudio: row.can_stream_audio,
  };
}

function mapVerse(row: VerseRow): ScriptureVerse {
  return {
    id: row.id,
    translationId: row.translation_id,
    bookId: row.book_id,
    chapter: row.chapter,
    verse: row.verse,
    text: row.text,
    textHash: row.text_hash,
  };
}
