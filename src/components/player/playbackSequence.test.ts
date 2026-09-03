import { describe, expect, it } from "vitest";

import {
  getEndedPlaybackIndex,
  shouldRefreshSignedUrls,
  SIGNED_URL_LOOP_REFRESH_AGE_MS,
  SIGNED_URL_REFRESH_AGE_MS,
} from "@/components/player/playbackSequence";

describe("ordered playback sequence", () => {
  it("stops at the end in play-once mode", () => {
    expect(getEndedPlaybackIndex(0, 3, "once")).toBe(1);
    expect(getEndedPlaybackIndex(1, 3, "once")).toBe(2);
    expect(getEndedPlaybackIndex(2, 3, "once")).toBeNull();
  });

  it("keeps one verse and unrelated selections stable through long loops", () => {
    let singleIndex = 0;
    let selectionIndex = 0;

    for (let iteration = 0; iteration < 10_000; iteration += 1) {
      singleIndex = getEndedPlaybackIndex(singleIndex, 1, "loop") ?? -1;
      selectionIndex = getEndedPlaybackIndex(selectionIndex, 3, "loop") ?? -1;
      expect(singleIndex).toBe(0);
      expect(selectionIndex).toBeGreaterThanOrEqual(0);
      expect(selectionIndex).toBeLessThan(3);
    }

    expect(selectionIndex).toBe(1);
  });

  it("renews signed URLs near expiry and earlier at loop edges", () => {
    expect(shouldRefreshSignedUrls(1_000, 1_000 + SIGNED_URL_REFRESH_AGE_MS - 1)).toBe(false);
    expect(shouldRefreshSignedUrls(1_000, 1_000 + SIGNED_URL_REFRESH_AGE_MS)).toBe(true);
    expect(shouldRefreshSignedUrls(1_000, 1_000 + SIGNED_URL_LOOP_REFRESH_AGE_MS - 1, true)).toBe(false);
    expect(shouldRefreshSignedUrls(1_000, 1_000 + SIGNED_URL_LOOP_REFRESH_AGE_MS, true)).toBe(true);
  });
});
