import { parseReference, type PassageRef } from "@/lib/bible/reference";
import { ScriptureError } from "@/lib/scripture/errors";
import { type CanonicalPassage, type NormalizedScriptureSelection, type ScriptureVerse } from "@/lib/scripture/types";

export const MAX_SELECTION_VERSES = 200;

export type PassageResolver = (
  reference: PassageRef,
  translationCode: string,
) => Promise<CanonicalPassage>;

export async function normalizeScriptureSelection(
  references: string[],
  translationCode: string,
  resolvePassage: PassageResolver,
): Promise<NormalizedScriptureSelection> {
  if (references.length === 0) {
    throw new ScriptureError(
      "invalid_reference",
      "At least one scripture reference is required.",
    );
  }

  const verses: ScriptureVerse[] = [];
  const seen = new Set<string>();

  for (const input of references) {
    const reference = parseReference(input);
    if (!reference) {
      throw new ScriptureError(
        "invalid_reference",
        `Invalid scripture reference: ${input}`,
      );
    }

    const passage = await resolvePassage(reference, translationCode);
    for (const verse of passage.verses) {
      const key = `${verse.translationId}:${verse.bookId}:${verse.chapter}:${verse.verse}`;
      if (seen.has(key)) continue;

      seen.add(key);
      verses.push(verse);

      if (verses.length > MAX_SELECTION_VERSES) {
        throw new ScriptureError(
          "selection_too_large",
          `A selection may contain at most ${MAX_SELECTION_VERSES} verses.`,
        );
      }
    }
  }

  return { translationCode, verses };
}
