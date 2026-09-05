import { getBook, parseReference, type PassageRef } from "@/lib/bible/reference";

export function validatePlaylistName(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "Enter a playlist name.";
  }
  if (value.trim().length > 80) return "Playlist names must be 80 characters or fewer.";
  return null;
}

export function parseSingleVerseReference(value: unknown): PassageRef | null {
  if (typeof value !== "string") return null;
  const reference = parseReference(value);
  if (
    !reference ||
    !getBook(reference.bookId) ||
    reference.verseStart === null ||
    reference.verseEnd !== null
  ) {
    return null;
  }
  return reference;
}
