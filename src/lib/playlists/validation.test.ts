import { describe, expect, it } from "vitest";

import { parseSingleVerseReference, validatePlaylistName } from "@/lib/playlists/validation";

describe("playlist validation", () => {
  it("accepts a useful name and rejects blank or oversized names", () => {
    expect(validatePlaylistName("Morning hope")).toBeNull();
    expect(validatePlaylistName("   ")).toBe("Enter a playlist name.");
    expect(validatePlaylistName("a".repeat(81))).toContain("80 characters");
  });

  it("only accepts a single canonical verse", () => {
    expect(parseSingleVerseReference("John 3:16")).toEqual({
      bookId: "JHN",
      chapter: 3,
      verseStart: 16,
      verseEnd: null,
    });
    expect(parseSingleVerseReference("John 3")).toBeNull();
    expect(parseSingleVerseReference("John 3:16-17")).toBeNull();
  });
});
