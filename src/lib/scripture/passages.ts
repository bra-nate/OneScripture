import { getBook, type PassageRef } from "@/lib/bible/reference";
import { ScriptureError } from "@/lib/scripture/errors";

export function validatePassageReference(reference: PassageRef): void {
  const book = getBook(reference.bookId);

  if (
    !book ||
    !Number.isInteger(reference.chapter) ||
    reference.chapter < 1 ||
    reference.chapter > book.chapters
  ) {
    throw new ScriptureError("invalid_reference", "Unknown book or chapter.");
  }

  const { verseStart, verseEnd } = reference;
  if (verseStart === null && verseEnd !== null) {
    throw new ScriptureError(
      "invalid_reference",
      "A verse range must include a starting verse.",
    );
  }

  if (
    (verseStart !== null && (!Number.isInteger(verseStart) || verseStart < 1)) ||
    (verseEnd !== null && (!Number.isInteger(verseEnd) || verseEnd < 1)) ||
    (verseStart !== null && verseEnd !== null && verseEnd < verseStart)
  ) {
    throw new ScriptureError("invalid_reference", "Invalid verse or verse range.");
  }
}

export function expectedVerseCount(reference: PassageRef): number | null {
  if (reference.verseStart === null) return null;
  return (reference.verseEnd ?? reference.verseStart) - reference.verseStart + 1;
}
