import {
  buildSelectionHash,
  type CreateSelectionResponse,
  type SelectionVoiceId,
} from "@/lib/audio/selection-contract";

export const AUDIO_MODEL_ID = "hexgrad/Kokoro-82M";
export const AUDIO_MODEL_VERSION = "kokoro-82m-v1.0-f3ff357";
export const SELECTION_RATE_LIMIT_REQUESTS = 10;
export const SELECTION_RATE_LIMIT_WINDOW_SECONDS = 60;

type SelectionServiceErrorCode =
  | "rate_limited"
  | "selection_persistence_failed";

export class SelectionServiceError extends Error {
  constructor(
    public readonly code: SelectionServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SelectionServiceError";
  }
}

export interface CanonicalSelectionInput {
  userId: string | null;
  translationCode: "WEB";
  translationId: string;
  voiceId: SelectionVoiceId;
  verses: Array<{
    id: number;
    displayReference: string;
  }>;
}

interface RpcResult<T> {
  data: T | null;
  error: { message: string } | null;
}

export interface SelectionRpcClient {
  rpc(
    functionName: string,
    parameters: Record<string, unknown>,
  ): PromiseLike<RpcResult<unknown>>;
}

interface CreateSelectionRow {
  selection_id: string;
  selection_status: CreateSelectionResponse["status"];
  ready_count: number;
  total_count: number;
}

export async function persistCanonicalAudioSelection(
  input: CanonicalSelectionInput,
  client: SelectionRpcClient,
): Promise<CreateSelectionResponse> {
  const scriptureVerseIds = input.verses.map((verse) => verse.id);
  const selectionHash = buildSelectionHash({
    translationId: input.translationId,
    voiceId: input.voiceId,
    scriptureVerseIds,
  });
  const { data, error } = await client.rpc("create_audio_selection", {
    p_user_id: input.userId,
    p_translation_code: input.translationCode,
    p_voice_id: input.voiceId,
    p_model_id: AUDIO_MODEL_ID,
    p_model_version: AUDIO_MODEL_VERSION,
    p_selection_hash: selectionHash,
    p_scripture_verse_ids: scriptureVerseIds,
    p_display_refs: input.verses.map((verse) => verse.displayReference),
    p_expires_in_seconds: 60 * 60,
  });
  if (error) {
    throw new SelectionServiceError(
      "selection_persistence_failed",
      `Unable to create the audio selection: ${error.message}`,
    );
  }
  const row = Array.isArray(data) ? (data[0] as CreateSelectionRow | undefined) : undefined;
  if (!row) {
    throw new SelectionServiceError(
      "selection_persistence_failed",
      "The audio selection did not return a result.",
    );
  }
  return {
    selectionId: row.selection_id,
    status: row.selection_status,
    ready: row.ready_count,
    total: row.total_count,
  };
}

export async function enforceAudioSelectionRateLimit(
  rateLimitKey: string,
  client: SelectionRpcClient,
): Promise<void> {
  const { data, error } = await client.rpc("consume_audio_selection_rate_limit", {
    p_rate_limit_key: rateLimitKey,
    p_max_requests: SELECTION_RATE_LIMIT_REQUESTS,
    p_window_seconds: SELECTION_RATE_LIMIT_WINDOW_SECONDS,
  });
  if (error || typeof data !== "boolean") {
    throw new SelectionServiceError(
      "selection_persistence_failed",
      "The audio selection rate limit could not be checked.",
    );
  }
  if (!data) {
    throw new SelectionServiceError(
      "rate_limited",
      "Too many audio selections were requested. Try again shortly.",
    );
  }
}
