import { expect, test } from "vitest";
import { parseReference, formatDisplayRef } from "@/lib/bible/reference";

test("parses book chapter verse", () => {
  expect(parseReference("John 3:16")).toEqual({
    bookId: "JHN",
    chapter: 3,
    verseStart: 16,
    verseEnd: null,
  });
});

test("parses verse range", () => {
  expect(parseReference("John 3:16-17")).toEqual({
    bookId: "JHN",
    chapter: 3,
    verseStart: 16,
    verseEnd: 17,
  });
});

test("parses chapter only", () => {
  expect(parseReference("Psalms 23")).toEqual({
    bookId: "PSA",
    chapter: 23,
    verseStart: null,
    verseEnd: null,
  });
});

test("parses numbered book", () => {
  expect(parseReference("1 John 2")).toEqual({
    bookId: "1JN",
    chapter: 2,
    verseStart: null,
    verseEnd: null,
  });
});

test("is case-insensitive and tolerates extra spaces", () => {
  expect(parseReference("  romans   8 : 28 ")).toEqual({
    bookId: "ROM",
    chapter: 8,
    verseStart: 28,
    verseEnd: null,
  });
});

test("returns null for unknown book", () => {
  expect(parseReference("Frodo 1:1")).toBeNull();
});

test("returns null when chapter missing", () => {
  expect(parseReference("John")).toBeNull();
});

test("formats display ref with en-dash and translation", () => {
  expect(
    formatDisplayRef(
      { bookId: "JHN", chapter: 3, verseStart: 16, verseEnd: 17 },
      "ESV",
    ),
  ).toBe("John 3:16–17 · ESV");
});

test("formats single-verse display ref", () => {
  expect(
    formatDisplayRef(
      { bookId: "PSA", chapter: 23, verseStart: null, verseEnd: null },
      "KJV",
    ),
  ).toBe("Psalms 23 · KJV");
});
