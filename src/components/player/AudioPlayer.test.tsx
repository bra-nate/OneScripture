import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AudioPlayer } from "@/components/player/AudioPlayer";
import { DEFAULT_PLAYBACK_PREFERENCES } from "@/components/player/preferences";
import { type AudioSelectionItem } from "@/components/player/types";

const ITEMS: AudioSelectionItem[] = [
  { id: "1", position: 0, reference: "John 3:16", url: "https://audio.test/1.mp3" },
  { id: "2", position: 1, reference: "Psalm 23:1", url: "https://audio.test/2.mp3" },
  { id: "3", position: 2, reference: "Romans 8:28", url: "https://audio.test/3.mp3" },
];

describe("AudioPlayer", () => {
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

  it("plays an ordered selection once and stops on the final verse", async () => {
    const onRefreshItems = vi.fn().mockResolvedValue(ITEMS);
    const view = render(
      <AudioPlayer
        items={ITEMS}
        onPreferencesChange={vi.fn()}
        onRefreshItems={onRefreshItems}
        preferences={DEFAULT_PLAYBACK_PREFERENCES}
      />,
    );
    const audio = view.container.querySelector("audio");
    expect(audio).not.toBeNull();
    expect(screen.getByText("John 3:16")).toBeTruthy();

    fireEvent.ended(audio!);
    await waitFor(() => expect(screen.getByText("Psalm 23:1")).toBeTruthy());
    fireEvent.ended(audio!);
    await waitFor(() => expect(screen.getByText("Romans 8:28")).toBeTruthy());
    fireEvent.ended(audio!);

    expect(screen.getByText("Romans 8:28")).toBeTruthy();
    expect(onRefreshItems).not.toHaveBeenCalled();
  });

  it("returns to the first verse in repeat-selection mode", async () => {
    const onRefreshItems = vi.fn().mockResolvedValue(ITEMS);
    const view = render(
      <AudioPlayer
        items={ITEMS}
        onPreferencesChange={vi.fn()}
        onRefreshItems={onRefreshItems}
        preferences={{ ...DEFAULT_PLAYBACK_PREFERENCES, mode: "loop" }}
      />,
    );
    const audio = view.container.querySelector("audio");

    fireEvent.ended(audio!);
    await waitFor(() => expect(screen.getByText("Psalm 23:1")).toBeTruthy());
    fireEvent.ended(audio!);
    await waitFor(() => expect(screen.getByText("Romans 8:28")).toBeTruthy());
    fireEvent.ended(audio!);
    await waitFor(() => expect(screen.getByText("John 3:16")).toBeTruthy());

    expect(onRefreshItems).not.toHaveBeenCalled();
  });

  it("restarts a single-verse selection in repeat mode", async () => {
    const item = ITEMS[0];
    const view = render(
      <AudioPlayer
        items={[item]}
        onPreferencesChange={vi.fn()}
        onRefreshItems={vi.fn().mockResolvedValue([item])}
        preferences={{ ...DEFAULT_PLAYBACK_PREFERENCES, mode: "loop" }}
      />,
    );
    const audio = view.container.querySelector("audio")!;
    const play = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(audio, "play", { value: play });
    Object.defineProperty(audio, "currentTime", { configurable: true, value: 9, writable: true });

    fireEvent.ended(audio);

    await waitFor(() => expect(play).toHaveBeenCalledOnce());
    expect(audio.currentTime).toBe(0);
    expect(screen.getByLabelText("Pause scripture audio")).toBeTruthy();
  });
});
