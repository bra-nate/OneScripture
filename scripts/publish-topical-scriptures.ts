import { readFileSync } from "node:fs";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  parseTopicalCatalogue,
  type ParsedEditorialTopic,
} from "@/lib/topics/editorial";

const CATALOGUE_PATH = path.resolve(process.cwd(), "content/topics.json");
const TRANSLATION_CODE = "WEB";

interface TranslationRow {
  id: string;
}

function loadCatalogue(): ParsedEditorialTopic[] {
  const input: unknown = JSON.parse(readFileSync(CATALOGUE_PATH, "utf8"));
  return parseTopicalCatalogue(input);
}

function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --apply.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveTranslationId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase
    .from("scripture_translations")
    .select("id")
    .eq("code", TRANSLATION_CODE)
    .eq("can_display_text", true)
    .eq("can_generate_audio", true)
    .single<TranslationRow>();

  if (error || !data) {
    throw new Error(
      `Translation ${TRANSLATION_CODE} is not ready for topical audio: ${error?.message ?? "missing row"}`,
    );
  }
  return data.id;
}

async function preflightReferences(
  supabase: SupabaseClient,
  translationId: string,
  topics: ParsedEditorialTopic[],
): Promise<void> {
  for (const topic of topics) {
    for (const passage of topic.passages) {
      const { reference } = passage;
      const verseEnd = reference.verseEnd ?? reference.verseStart;
      const expectedCount = verseEnd - reference.verseStart + 1;
      const { count, error } = await supabase
        .from("scripture_verses")
        .select("id", { count: "exact", head: true })
        .eq("translation_id", translationId)
        .eq("book_id", reference.bookId)
        .eq("chapter", reference.chapter)
        .gte("verse", reference.verseStart)
        .lte("verse", verseEnd);

      if (error || count !== expectedCount) {
        throw new Error(
          `Reference preflight failed for ${topic.slug}, item ${passage.position}: expected ${expectedCount} verses, received ${count ?? "unknown"}.`,
        );
      }
    }
  }
}

async function replaceTopics(
  supabase: SupabaseClient,
  topics: ParsedEditorialTopic[],
): Promise<void> {
  for (const topic of topics) {
    const passages = topic.passages.map(({ position, reference }) => ({
      book_id: reference.bookId,
      chapter: reference.chapter,
      verse_start: reference.verseStart,
      verse_end: reference.verseEnd ?? reference.verseStart,
      position,
    }));
    const { error } = await supabase.rpc("replace_scripture_topic", {
      p_slug: topic.slug,
      p_title: topic.title,
      p_description: topic.description,
      p_status: topic.status,
      p_display_order: topic.displayOrder,
      p_is_featured: topic.isFeatured,
      p_translation_code: TRANSLATION_CODE,
      p_passages: passages,
    });

    if (error) {
      throw new Error(`Unable to publish ${topic.slug}: ${error.message}`);
    }
    console.log(
      `Updated ${topic.slug}: ${topic.passages.length} passages, status ${topic.status}.`,
    );
  }
}

async function main(): Promise<void> {
  const shouldApply = process.argv.includes("--apply");
  const topics = loadCatalogue();
  const passageCount = topics.reduce(
    (total, topic) => total + topic.passages.length,
    0,
  );

  console.log(`Validated ${topics.length} topics and ${passageCount} passages.`);
  if (!shouldApply) {
    console.log(
      "Dry run complete. Review content/topics.json, then pass --apply after migration 0005 is installed.",
    );
    return;
  }

  const supabase = createServiceClient();
  const translationId = await resolveTranslationId(supabase);
  await preflightReferences(supabase, translationId, topics);
  console.log("Every scripture reference exists in the canonical WEB catalogue.");
  await replaceTopics(supabase, topics);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown publish failure");
  process.exitCode = 1;
});
