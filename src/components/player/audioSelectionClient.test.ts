import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AudioSelectionClientError,
  createAudioSelectionService,
  getAudioSelectionService,
} from "@/components/player/audioSelectionClient";

describe("audio selection client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["one verse", ["John 3:16"]],
    ["a complete chapter", ["Psalm 23"]],
    ["three unrelated passages", ["John 3:16", "Psalm 23", "Romans 8:28"]],
  ])("creates the supported WEB selection contract for %s", async (_label, references) => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(
        {
          selectionId: "selection-id",
          status: "preparing",
          ready: 0,
          total: references.length,
        },
        { status: 202 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createAudioSelectionService(references, "af_heart"),
    ).resolves.toMatchObject({
      selectionId: "selection-id",
      total: references.length,
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/audio/selections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        references,
        translationId: "WEB",
        voiceId: "af_heart",
      }),
    });
  });

  it("validates ready items and surfaces API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        Response.json({
          selectionId: "selection-id",
          status: "ready",
          ready: 1,
          total: 1,
          items: [
            {
              id: "item-id",
              position: 0,
              reference: "John 3:16",
              url: "https://audio.test/john.mp3",
            },
          ],
        }),
      ),
    );
    await expect(getAudioSelectionService("selection-id")).resolves.toMatchObject({
      status: "ready",
      items: [{ reference: "John 3:16" }],
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        Response.json(
          { error: { code: "rate_limited", message: "Try again shortly." } },
          { status: 429 },
        ),
      ),
    );
    await expect(
      createAudioSelectionService(["John 3:16"], "af_heart"),
    ).rejects.toEqual(new AudioSelectionClientError("Try again shortly."));
  });
});
