import { describe, expect, it, vi } from "vitest";

import {
  loadAudioSelectionStatus,
  retryAudioSelection,
  SelectionStatusError,
} from "@/lib/audio/selection-status";
import { type SelectionRpcClient } from "@/lib/audio/selection-orchestration";

describe("audio selection status", () => {
  it("returns no playable items while generation is incomplete", async () => {
    const client = rpcClient([
      {
        selection_id: "selection-uuid",
        selection_status: "preparing",
        ready_count: 1,
        total_count: 2,
        item_id: 1,
        item_position: 1,
        display_reference: "John 3:16",
        asset_status: "ready",
        storage_path: "WEB/model/voice/JHN/003/016.mp3",
      },
    ]);
    const sign = vi.fn();

    await expect(
      loadAudioSelectionStatus("selection-uuid", null, client, sign),
    ).resolves.toEqual({
      selectionId: "selection-uuid",
      status: "preparing",
      ready: 1,
      total: 2,
      items: [],
    });
    expect(sign).not.toHaveBeenCalled();
  });

  it("signs every ordered item once the full selection is ready", async () => {
    const client = rpcClient([
      {
        selection_id: "selection-uuid",
        selection_status: "ready",
        ready_count: 2,
        total_count: 2,
        item_id: 7,
        item_position: 1,
        display_reference: "John 3:16",
        asset_status: "ready",
        storage_path: "first.mp3",
      },
      {
        selection_id: "selection-uuid",
        selection_status: "ready",
        ready_count: 2,
        total_count: 2,
        item_id: 8,
        item_position: 2,
        display_reference: "John 3:17",
        asset_status: "ready",
        storage_path: "second.mp3",
      },
    ]);
    const sign = vi.fn(async (path: string) => `signed:${path}`);

    const result = await loadAudioSelectionStatus(
      "selection-uuid",
      "user-uuid",
      client,
      sign,
    );

    expect(result.items.map((item) => item.reference)).toEqual([
      "John 3:16",
      "John 3:17",
    ]);
    expect(result.items.map((item) => item.url)).toEqual([
      "signed:first.mp3",
      "signed:second.mp3",
    ]);
  });

  it("distinguishes a missing selection and a retry with no eligible jobs", async () => {
    await expect(
      loadAudioSelectionStatus("missing", null, rpcClient([]), vi.fn()),
    ).rejects.toEqual(
      expect.objectContaining<Partial<SelectionStatusError>>({
        code: "selection_not_found",
      }),
    );
    await expect(
      retryAudioSelection("selection-uuid", null, rpcClient(0)),
    ).resolves.toBe(0);
  });
});

function rpcClient(data: unknown): SelectionRpcClient {
  return {
    rpc: vi.fn().mockResolvedValue({ data, error: null }),
  };
}
