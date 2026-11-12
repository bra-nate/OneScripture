import { describe, expect, it } from "vitest";

import { getNextPlaylistPosition, hasPlaylistVerse } from "@/lib/playlists/integrity";

const items = [
  {
    bookId: "JHN",
    chapter: 3,
    position: 4,
    translationId: "WEB",
    verse: 16,
  },
];

describe("playlist integrity", () => {
  it("recognizes an existing verse without matching another translation", () => {
    const reference = { bookId: "JHN", chapter: 3, verseEnd: null, verseStart: 16 };

    expect(hasPlaylistVerse(items, reference, "WEB")).toBe(true);
    expect(hasPlaylistVerse(items, reference, "KJV")).toBe(false);
  });

  it("places the next item after the highest position", () => {
    expect(getNextPlaylistPosition(items)).toBe(5);
    expect(getNextPlaylistPosition([])).toBe(0);
  });
});
