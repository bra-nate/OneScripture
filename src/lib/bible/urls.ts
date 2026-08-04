/**
 * Pure URL builders for the Bible.is / DBP4 API. Kept free of `fetch` and
 * environment access so they can be unit-tested in isolation.
 */

export function biblesUrl(base: string, key: string, languageCode: string): string {
  return `${base}bibles?language_code=${languageCode}&media=audio&key=${key}`;
}

export function booksUrl(base: string, key: string, bibleId: string): string {
  return `${base}bibles/books?bible_id=${bibleId}&key=${key}`;
}

export function chapterAudioUrl(
  base: string,
  key: string,
  filesetId: string,
  bookId: string,
  chapter: number,
): string {
  return `${base}bibles/filesets/${filesetId}/${bookId}/${chapter}?key=${key}`;
}
