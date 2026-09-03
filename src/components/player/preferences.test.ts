import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_PLAYBACK_PREFERENCES,
  PLAYBACK_PREFERENCES_KEY,
  readPlaybackPreferences,
  writePlaybackPreferences,
} from "@/components/player/preferences";

describe("playback preferences", () => {
  it("returns defaults when storage is empty or corrupt", () => {
    expect(readPlaybackPreferences({ getItem: () => null })).toEqual(
      DEFAULT_PLAYBACK_PREFERENCES,
    );
    expect(readPlaybackPreferences({ getItem: () => "{" })).toEqual(
      DEFAULT_PLAYBACK_PREFERENCES,
    );
  });

  it("keeps valid preferences and replaces invalid fields", () => {
    const stored = JSON.stringify({
      mode: "loop",
      speed: 1.25,
      voiceId: "am_michael",
      volume: 0.4,
    });
    expect(readPlaybackPreferences({ getItem: () => stored })).toEqual({
      mode: "loop",
      speed: 1.25,
      voiceId: "am_michael",
      volume: 0.4,
    });

    const invalid = JSON.stringify({
      mode: "forever",
      speed: 3,
      voiceId: "clone",
      volume: 2,
    });
    expect(readPlaybackPreferences({ getItem: () => invalid })).toEqual(
      DEFAULT_PLAYBACK_PREFERENCES,
    );
  });

  it("writes the versioned storage contract", () => {
    const setItem = vi.fn();
    writePlaybackPreferences({ setItem }, DEFAULT_PLAYBACK_PREFERENCES);
    expect(setItem).toHaveBeenCalledWith(
      PLAYBACK_PREFERENCES_KEY,
      JSON.stringify(DEFAULT_PLAYBACK_PREFERENCES),
    );
  });
});
