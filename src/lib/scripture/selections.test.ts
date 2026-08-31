import { describe, expect, test } from "vitest";

import { type PassageRef } from "@/lib/bible/reference";
import { ScriptureError } from "@/lib/scripture/errors";
import { MAX_SELECTION_VERSES, normalizeScriptureSelection, type PassageResolver } from "@/lib/scripture/selections";
import { type CanonicalPassage, type ScriptureVerse } from "@/lib/scripture/types";

const TRANSLATION_ID = "00000000-0000-0000-0000-000000000001";

function verse(bookId: string, chapter: number, number: number): ScriptureVerse {
  return {
    id: number,
    translationId: TRANSLATION_ID,
    bookId,
    chapter,
    verse: number,
    text: `${bookId} ${chapter}:${number}`,
    textHash: String(number).padStart(64, "0"),
  };
}

function passage(reference: PassageRef, verses: ScriptureVerse[]): CanonicalPassage {
  return {
    reference,
    translation: {
      id: TRANSLATION_ID,
      code: "WEB",
      name: "World English Bible",
      languageCode: "eng",
      sourceName: "eBible.org",
      sourceVersion: "2020 stable text edition",
      attribution: "Public Domain",
      canGenerateAudio: true,
      canStreamAudio: true,
    },
    verses,
  };
}

const resolvePassage: PassageResolver = async (reference) => {
  const end = reference.verseEnd ?? reference.verseStart ?? 3;
  const start = reference.verseStart ?? 1;
  const verses = Array.from({ length: end - start + 1 }, (_, index) =>
    verse(reference.bookId, reference.chapter, start + index),
  );
  return passage(reference, verses);
};

describe("scripture selection normalization", () => {
  test("preserves entered passage order and canonical verse order", async () => {
    const result = await normalizeScriptureSelection(
      ["John 3:16-17", "Psalms 23:1"],
      "WEB",
      resolvePassage,
    );

    expect(result.verses.map((item) => `${item.bookId}:${item.verse}`)).toEqual([
      "JHN:16",
      "JHN:17",
      "PSA:1",
    ]);
  });

  test("removes duplicate verses while preserving the first occurrence", async () => {
    const result = await normalizeScriptureSelection(
      ["John 3:16-17", "John 3:17"],
      "WEB",
      resolvePassage,
    );

    expect(result.verses.map((item) => item.verse)).toEqual([16, 17]);
  });

  test("rejects an invalid human reference", async () => {
    await expect(
      normalizeScriptureSelection(["Not a passage"], "WEB", resolvePassage),
    ).rejects.toMatchObject({
      code: "invalid_reference",
    });
  });

  test("propagates a missing canonical passage", async () => {
    const missingResolver: PassageResolver = async () => {
      throw new ScriptureError("passage_not_found", "Missing passage");
    };

    await expect(
      normalizeScriptureSelection(["John 3:16"], "WEB", missingResolver),
    ).rejects.toMatchObject({
      code: "passage_not_found",
    });
  });

  test("rejects a selection over the maximum verse count", async () => {
    const oversizedResolver: PassageResolver = async (reference) =>
      passage(
        reference,
        Array.from({ length: MAX_SELECTION_VERSES + 1 }, (_, index) =>
          verse("PSA", 119, index + 1),
        ),
      );

    await expect(
      normalizeScriptureSelection(["Psalms 119"], "WEB", oversizedResolver),
    ).rejects.toMatchObject({
      code: "selection_too_large",
    });
  });
});
