import "server-only";

import { cache } from "react";

import { formatPassageRef, type PassageRef } from "@/lib/bible/reference";
import { createClient } from "@/lib/supabase/server";
import {
  type ScriptureTopic,
  type TopicPassage,
  type TopicSummary,
} from "@/lib/topics/types";

interface TopicRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  is_featured: boolean;
}

interface TopicPassageRow {
  id: string;
  topic_id: string;
  book_id: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  position: number;
}

export class TopicCatalogueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TopicCatalogueError";
  }
}

export async function listPublishedTopics(): Promise<TopicSummary[]> {
  const supabase = await createClient();
  const { data: topics, error: topicsError } = await supabase
    .from("scripture_topics")
    .select("id, slug, title, description, is_featured")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true })
    .returns<TopicRow[]>();

  if (topicsError) {
    throw new TopicCatalogueError("The topical catalogue could not be loaded.");
  }
  if (!topics?.length) return [];

  const topicIds = topics.map((topic) => topic.id);
  const { data: passages, error: passagesError } = await supabase
    .from("scripture_topic_passages")
    .select("topic_id")
    .in("topic_id", topicIds)
    .returns<Array<{ topic_id: string }>>();

  if (passagesError) {
    throw new TopicCatalogueError("Topic passage counts could not be loaded.");
  }

  const passageCounts = new Map<string, number>();
  for (const passage of passages ?? []) {
    passageCounts.set(
      passage.topic_id,
      (passageCounts.get(passage.topic_id) ?? 0) + 1,
    );
  }

  return topics.map((topic) => mapTopicSummary(topic, passageCounts.get(topic.id) ?? 0));
}

export const getPublishedTopic = cache(
  async (slug: string): Promise<ScriptureTopic | null> => {
    const supabase = await createClient();
    const { data: topics, error: topicError } = await supabase
      .from("scripture_topics")
      .select("id, slug, title, description, is_featured")
      .eq("slug", slug)
      .eq("status", "published")
      .limit(1)
      .returns<TopicRow[]>();

    if (topicError) {
      throw new TopicCatalogueError("The topic could not be loaded.");
    }

    const topic = topics?.[0];
    if (!topic) return null;

    const { data: passageRows, error: passagesError } = await supabase
      .from("scripture_topic_passages")
      .select("id, topic_id, book_id, chapter, verse_start, verse_end, position")
      .eq("topic_id", topic.id)
      .order("position", { ascending: true })
      .returns<TopicPassageRow[]>();

    if (passagesError) {
      throw new TopicCatalogueError("The topic passages could not be loaded.");
    }

    const passages = (passageRows ?? []).map(mapTopicPassage);
    return {
      ...mapTopicSummary(topic, passages.length),
      translationCode: "WEB",
      passages,
    };
  },
);

function mapTopicSummary(row: TopicRow, passageCount: number): TopicSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    isFeatured: row.is_featured,
    passageCount,
  };
}

function mapTopicPassage(row: TopicPassageRow): TopicPassage {
  const reference: PassageRef = {
    bookId: row.book_id,
    chapter: row.chapter,
    verseStart: row.verse_start,
    verseEnd: row.verse_end === row.verse_start ? null : row.verse_end,
  };
  return {
    id: row.id,
    position: row.position,
    reference,
    displayReference: formatPassageRef(reference),
  };
}
