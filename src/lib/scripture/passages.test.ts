import { describe, expect, test } from "vitest";

import { type PassageRef } from "@/lib/bible/reference";
import { ScriptureError } from "@/lib/scripture/errors";
import { expectedVerseCount, validatePassageReference } from "@/lib/scripture/passages";

const JOHN_3: PassageRef = {
  bookId: "JHN",
  chapter: 3,
  verseStart: null,
  verseEnd: null,
};

describe("passage reference validation", () => {
  test("accepts a complete chapter", () => {
    expect(() => validatePassageReference(JOHN_3)).not.toThrow();
  });

  test("accepts a forward verse range", () => {
    expect(() =>
      validatePassageReference({
        ...JOHN_3,
        verseStart: 16,
        verseEnd: 18,
      }),
    ).not.toThrow();
  });

  test.each([
    { ...JOHN_3, chapter: 0 },
    { ...JOHN_3, chapter: 22 },
    { ...JOHN_3, verseStart: 0 },
    { ...JOHN_3, verseStart: 18, verseEnd: 16 },
    { ...JOHN_3, verseEnd: 16 },
  ])("rejects invalid reference %#", (reference) => {
    expect(() => validatePassageReference(reference)).toThrow(ScriptureError);
  });
});

describe("expected verse count", () => {
  test("leaves a chapter count open", () => {
    expect(expectedVerseCount(JOHN_3)).toBeNull();
  });

  test("counts one verse", () => {
    expect(expectedVerseCount({ ...JOHN_3, verseStart: 16 })).toBe(1);
  });

  test("counts an inclusive range", () => {
    expect(
      expectedVerseCount({ ...JOHN_3, verseStart: 16, verseEnd: 18 }),
    ).toBe(3);
  });
});
