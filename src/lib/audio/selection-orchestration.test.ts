import { describe, expect, it, vi } from "vitest";

import {
  AUDIO_MODEL_ID,
  AUDIO_MODEL_VERSION,
  enforceAudioSelectionRateLimit,
  persistCanonicalAudioSelection,
  SelectionServiceError,
  type SelectionRpcClient,
} from "@/lib/audio/selection-orchestration";

const INPUT = {
  userId: null,
  translationCode: "WEB" as const,
  translationId: "translation-uuid",
  voiceId: "af_heart" as const,
  verses: [
    { id: 101, displayReference: "John 3:16" },
    { id: 102, displayReference: "John 3:17" },
  ],
};

describe("audio selection orchestration", () => {
  it("persists one ordered atomic selection", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          selection_id: "selection-uuid",
          selection_status: "preparing",
          ready_count: 1,
          total_count: 2,
        },
      ],
      error: null,
    });
    const client = { rpc } as SelectionRpcClient;

    await expect(persistCanonicalAudioSelection(INPUT, client)).resolves.toEqual({
      selectionId: "selection-uuid",
      status: "preparing",
      ready: 1,
      total: 2,
    });
    expect(rpc).toHaveBeenCalledWith(
      "create_audio_selection",
      expect.objectContaining({
        p_user_id: null,
        p_translation_code: "WEB",
        p_voice_id: "af_heart",
        p_model_id: AUDIO_MODEL_ID,
        p_model_version: AUDIO_MODEL_VERSION,
        p_scripture_verse_ids: [101, 102],
        p_display_refs: ["John 3:16", "John 3:17"],
      }),
    );
  });

  it("stops before persistence when the rate limit is exhausted", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });

    await expect(
      enforceAudioSelectionRateLimit("a".repeat(64), {
        rpc,
      } as SelectionRpcClient),
    ).rejects.toEqual(
      expect.objectContaining<Partial<SelectionServiceError>>({
        code: "rate_limited",
      }),
    );
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("accepts a rate-limit slot using only its hashed identity", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });

    await expect(
      enforceAudioSelectionRateLimit("a".repeat(64), {
        rpc,
      } as SelectionRpcClient),
    ).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith("consume_audio_selection_rate_limit", {
      p_rate_limit_key: "a".repeat(64),
      p_max_requests: 10,
      p_window_seconds: 60,
    });
  });

  it("returns a stable persistence error without exposing database details", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "database detail" } });

    await expect(
      persistCanonicalAudioSelection(INPUT, { rpc } as SelectionRpcClient),
    ).rejects.toEqual(
      expect.objectContaining<Partial<SelectionServiceError>>({
        code: "selection_persistence_failed",
      }),
    );
  });
});
