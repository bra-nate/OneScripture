import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PLAYBACK_PREFERENCES_KEY,
} from "@/components/player/preferences";
import { usePlaybackPreferences } from "@/components/player/usePlaybackPreferences";

describe("usePlaybackPreferences", () => {
  const values = new Map<string, string>();
  const storage = {
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    values.clear();
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    values.clear();
  });

  it("restores preferences after hydration and persists later changes", () => {
    storage.setItem(
      PLAYBACK_PREFERENCES_KEY,
      JSON.stringify({
        mode: "loop",
        speed: 1.25,
        voiceId: "am_michael",
        volume: 0.45,
      }),
    );
    const { result } = renderHook(() => usePlaybackPreferences());

    act(() => vi.runAllTimers());
    expect(result.current.preferences).toEqual({
      mode: "loop",
      speed: 1.25,
      voiceId: "am_michael",
      volume: 0.45,
    });

    act(() => result.current.updatePreferences({ volume: 0.8 }));
    expect(JSON.parse(storage.getItem(PLAYBACK_PREFERENCES_KEY)!)).toMatchObject({
      mode: "loop",
      voiceId: "am_michael",
      volume: 0.8,
    });
  });
});
