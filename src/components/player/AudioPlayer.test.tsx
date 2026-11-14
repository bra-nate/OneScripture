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
    stubAudioDownloads();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

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

  it("plays each verse from its downloaded local copy", async () => {
    const view = render(
      <AudioPlayer
        items={ITEMS}
        onPreferencesChange={vi.fn()}
        onRefreshItems={vi.fn().mockResolvedValue(ITEMS)}
        preferences={DEFAULT_PLAYBACK_PREFERENCES}
      />,
    );
    const audio = view.container.querySelector("audio")!;

    await waitFor(() => expect(audio.getAttribute("src")).toBe("blob:local/1"));
    expect(fetch).toHaveBeenCalledWith(ITEMS[0].url, expect.anything());
  });

  it("repeats a downloaded selection without re-signing or re-downloading", async () => {
    const onRefreshItems = vi.fn().mockResolvedValue(ITEMS);
    const view = render(
      <AudioPlayer
        items={ITEMS}
        onPreferencesChange={vi.fn()}
        onRefreshItems={onRefreshItems}
        preferences={{ ...DEFAULT_PLAYBACK_PREFERENCES, mode: "loop" }}
      />,
    );
    const audio = view.container.querySelector("audio")!;
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));

    // Well past the point where signed URLs would normally be renewed.
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 60 * 60 * 1_000);
    for (const reference of ["Psalm 23:1", "Romans 8:28", "John 3:16", "Psalm 23:1"]) {
      fireEvent.ended(audio);
      await waitFor(() => expect(screen.getByText(reference)).toBeTruthy());
    }

    expect(onRefreshItems).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(audio.getAttribute("src")).toMatch(/^blob:local\//);
  });

  it("uses native looping for a single-verse selection", () => {
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

    expect(audio.loop).toBe(true);
    fireEvent.ended(audio);

    expect(play).not.toHaveBeenCalled();
    expect(audio.currentTime).toBe(9);
  });

  it("exposes descriptive range values to assistive technology", () => {
    const view = render(
      <AudioPlayer
        items={[ITEMS[0]]}
        onPreferencesChange={vi.fn()}
        onRefreshItems={vi.fn().mockResolvedValue([ITEMS[0]])}
        preferences={DEFAULT_PLAYBACK_PREFERENCES}
      />,
    );
    const audio = view.container.querySelector("audio")!;

    Object.defineProperty(audio, "duration", { configurable: true, value: 75 });
    Object.defineProperty(audio, "currentTime", { configurable: true, value: 5 });
    fireEvent.loadedMetadata(audio);
    fireEvent.timeUpdate(audio);

    expect(screen.getByLabelText("Audio progress").getAttribute("aria-valuetext"))
      .toBe("0:05 of 1:15");
  });
});

function stubAudioDownloads() {
  let count = 0;
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, blob: async () => new Blob(["mp3"]) })));
  URL.createObjectURL = vi.fn(() => `blob:local/${++count}`);
  URL.revokeObjectURL = vi.fn();
}
