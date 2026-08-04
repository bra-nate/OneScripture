import { biblesUrl, booksUrl, chapterAudioUrl } from "@/lib/bible/urls";
import type { BibleSummary, BibleBook, ChapterAudio } from "@/types/bible";

/**
 * Typed wrapper around the Bible.is / DBP4 API. All Bible.is calls in the app
 * go through this client — never call the API directly from components.
 *
 * Server-only: reads BIBLE_IS_API_KEY from the environment. Do not import into
 * client components (the key must never reach the browser).
 */

const BASE = "https://4.dbt.io/api/";

function apiKey(): string {
  const key = process.env.BIBLE_IS_API_KEY;
  if (!key) throw new Error("BIBLE_IS_API_KEY is not set");
  return key;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Bible.is request failed (${res.status}): ${url}`);
  }
  const body = (await res.json()) as { data: T };
  return body.data;
}

export const bibleClient = {
  /** List audio Bibles available for a language code (e.g. "eng", "tw", "gaa"). */
  listBibles: (languageCode: string): Promise<BibleSummary[]> =>
    getJson<BibleSummary[]>(biblesUrl(BASE, apiKey(), languageCode)),

  /** List the books available for a given Bible id. */
  listBooks: (bibleId: string): Promise<BibleBook[]> =>
    getJson<BibleBook[]>(booksUrl(BASE, apiKey(), bibleId)),

  /** Get chapter audio (incl. the direct MP3 `path`) for a fileset. */
  getChapterAudio: (
    filesetId: string,
    bookId: string,
    chapter: number,
  ): Promise<ChapterAudio[]> =>
    getJson<ChapterAudio[]>(chapterAudioUrl(BASE, apiKey(), filesetId, bookId, chapter)),
};
