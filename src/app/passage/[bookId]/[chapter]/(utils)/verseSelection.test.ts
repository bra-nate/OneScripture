import { describe, expect, it } from "vitest";

import { toggleVerseSelection } from "@/app/passage/[bookId]/[chapter]/(utils)/verseSelection";

const AVAILABLE = [1, 2, 3, 4, 5];

function select(verses: number[]) {
  return new Set(verses);
}

describe("toggleVerseSelection", () => {
  it("adds and removes a single verse", () => {
    const added = toggleVerseSelection({
      anchor: null,
      availableVerses: AVAILABLE,
      isRangeExtend: false,
      selected: select([]),
      verse: 3,
    });
    expect([...added]).toEqual([3]);

    const removed = toggleVerseSelection({
      anchor: 3,
      availableVerses: AVAILABLE,
      isRangeExtend: false,
      selected: added,
      verse: 3,
    });
    expect([...removed]).toEqual([]);
  });

  it("extends a range forwards from the anchor", () => {
    const result = toggleVerseSelection({
      anchor: 2,
      availableVerses: AVAILABLE,
      isRangeExtend: true,
      selected: select([2]),
      verse: 4,
    });
    expect([...result].sort()).toEqual([2, 3, 4]);
  });

  it("extends a range backwards from the anchor", () => {
    const result = toggleVerseSelection({
      anchor: 4,
      availableVerses: AVAILABLE,
      isRangeExtend: true,
      selected: select([4]),
      verse: 2,
    });
    expect([...result].sort()).toEqual([2, 3, 4]);
  });

  it("never deselects while extending, and only covers real verses", () => {
    const result = toggleVerseSelection({
      anchor: 1,
      availableVerses: [1, 2, 3],
      isRangeExtend: true,
      selected: select([1, 2, 3]),
      verse: 9,
    });
    expect([...result].sort()).toEqual([1, 2, 3]);
  });

  it("falls back to a plain toggle when there is no anchor", () => {
    const result = toggleVerseSelection({
      anchor: null,
      availableVerses: AVAILABLE,
      isRangeExtend: true,
      selected: select([]),
      verse: 5,
    });
    expect([...result]).toEqual([5]);
  });
});
