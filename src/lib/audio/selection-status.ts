import {
  type SelectionStatusResponse,
} from "@/lib/audio/selection-contract";
import { type SelectionRpcClient } from "@/lib/audio/selection-orchestration";

type SelectionStatusErrorCode =
  | "selection_not_found"
  | "selection_status_failed"
  | "selection_retry_failed";

export class SelectionStatusError extends Error {
  constructor(
    public readonly code: SelectionStatusErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SelectionStatusError";
  }
}

interface SelectionStatusRow {
  selection_id: string;
  selection_status: SelectionStatusResponse["status"];
  ready_count: number;
  total_count: number;
  item_id: number;
  item_position: number;
  display_reference: string;
  asset_status: string;
  storage_path: string | null;
}

export type SignAudioPath = (storagePath: string) => Promise<string>;

export async function loadAudioSelectionStatus(
  selectionId: string,
  userId: string | null,
  client: SelectionRpcClient,
  signAudioPath: SignAudioPath,
): Promise<SelectionStatusResponse> {
  const { data, error } = await client.rpc("get_audio_selection_status", {
    p_selection_id: selectionId,
    p_user_id: userId,
  });
  if (error) {
    throw new SelectionStatusError(
      "selection_status_failed",
      "The audio selection status could not be loaded.",
    );
  }
  const rows = Array.isArray(data) ? (data as SelectionStatusRow[]) : [];
  const first = rows[0];
  if (!first) {
    throw new SelectionStatusError(
      "selection_not_found",
      "The audio selection was not found or has expired.",
    );
  }

  const items =
    first.selection_status === "ready"
      ? await Promise.all(
          rows.map(async (row) => {
            if (row.asset_status !== "ready" || !row.storage_path) {
              throw new SelectionStatusError(
                "selection_status_failed",
                "A ready selection contains an invalid audio asset.",
              );
            }
            return {
              id: String(row.item_id),
              position: row.item_position,
              reference: row.display_reference,
              url: await signAudioPath(row.storage_path),
            };
          }),
        )
      : [];

  return {
    selectionId: first.selection_id,
    status: first.selection_status,
    ready: first.ready_count,
    total: first.total_count,
    items,
  };
}

export async function retryAudioSelection(
  selectionId: string,
  userId: string | null,
  client: SelectionRpcClient,
): Promise<number> {
  const { data, error } = await client.rpc("retry_audio_selection", {
    p_selection_id: selectionId,
    p_user_id: userId,
  });
  if (error || typeof data !== "number") {
    throw new SelectionStatusError(
      "selection_retry_failed",
      "The failed audio jobs could not be retried.",
    );
  }
  if (data < 0) {
    throw new SelectionStatusError(
      "selection_not_found",
      "The audio selection was not found or has expired.",
    );
  }
  return data;
}
