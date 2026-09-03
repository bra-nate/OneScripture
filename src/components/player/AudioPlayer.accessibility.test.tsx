import { render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AudioPlayer } from "@/components/player/AudioPlayer";
import { PlayerPreferences } from "@/components/player/PlayerPreferences";
import { DEFAULT_PLAYBACK_PREFERENCES } from "@/components/player/preferences";
import { type AudioSelectionItem } from "@/components/player/types";

const ITEM: AudioSelectionItem = {
  id: "1",
  position: 0,
  reference: "John 3:16",
  url: "https://audio.test/1.mp3",
};

describe("player accessibility", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "Audio",
      class AudioPreloader {
        preload = "";
        src = "";
        load = vi.fn();
        removeAttribute = vi.fn();
      },
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("has no automated semantic accessibility violations", async () => {
    const view = render(
      <main>
        <AudioPlayer
          items={[ITEM]}
          onPreferencesChange={vi.fn()}
          onRefreshItems={vi.fn().mockResolvedValue([ITEM])}
          preferences={DEFAULT_PLAYBACK_PREFERENCES}
        />
        <PlayerPreferences
          onChange={vi.fn()}
          preferences={DEFAULT_PLAYBACK_PREFERENCES}
        />
      </main>,
    );

    const results = await axe.run(view.container, {
      rules: { "color-contrast": { enabled: false } },
    });

    expect(results.violations).toEqual([]);
  });
});
