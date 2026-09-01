import { createHash } from "node:crypto";

export const SELECTION_API_TRANSLATION = "WEB";
export const SELECTION_API_VOICES = ["af_heart", "am_michael"] as const;
export const MAX_SELECTION_REFERENCES = 20;

export type SelectionVoiceId = (typeof SELECTION_API_VOICES)[number];

export type SelectionRequestErrorCode =
  | "invalid_request"
  | "unsupported_translation"
  | "unsupported_voice";

export class SelectionRequestError extends Error {
  constructor(
    public readonly code: SelectionRequestErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SelectionRequestError";
  }
}

export interface CreateSelectionRequest {
  translationId: typeof SELECTION_API_TRANSLATION;
  voiceId: SelectionVoiceId;
  references: string[];
}

export interface CreateSelectionResponse {
  selectionId: string;
  status: "preparing" | "ready" | "partially_failed" | "failed";
  ready: number;
  total: number;
}

export interface ReadySelectionItem {
  id: string;
  position: number;
  reference: string;
  url: string;
}

export interface SelectionStatusResponse extends CreateSelectionResponse {
  items: ReadySelectionItem[];
}

export function parseCreateSelectionRequest(
  value: unknown,
): CreateSelectionRequest {
  if (!isRecord(value)) {
    throw new SelectionRequestError(
      "invalid_request",
      "The request body must be a JSON object.",
    );
  }

  const translationId =
    typeof value.translationId === "string"
      ? value.translationId.trim().toUpperCase()
      : "";
  if (translationId !== SELECTION_API_TRANSLATION) {
    throw new SelectionRequestError(
      "unsupported_translation",
      `Only ${SELECTION_API_TRANSLATION} is available for audio generation.`,
    );
  }

  const voiceId = typeof value.voiceId === "string" ? value.voiceId.trim() : "";
  if (!isSelectionVoiceId(voiceId)) {
    throw new SelectionRequestError(
      "unsupported_voice",
      "Choose either af_heart or am_michael.",
    );
  }

  if (
    !Array.isArray(value.references) ||
    value.references.length < 1 ||
    value.references.length > MAX_SELECTION_REFERENCES
  ) {
    throw new SelectionRequestError(
      "invalid_request",
      `Provide between 1 and ${MAX_SELECTION_REFERENCES} scripture references.`,
    );
  }
  const references = value.references.map((reference) => {
    if (typeof reference !== "string") {
      throw new SelectionRequestError(
        "invalid_request",
        "Every scripture reference must be a string.",
      );
    }
    const normalized = reference.trim();
    if (!normalized || normalized.length > 100) {
      throw new SelectionRequestError(
        "invalid_request",
        "Each scripture reference must contain 1 to 100 characters.",
      );
    }
    return normalized;
  });

  return {
    translationId: SELECTION_API_TRANSLATION,
    voiceId,
    references,
  };
}

export function buildSelectionHash(input: {
  translationId: string;
  voiceId: SelectionVoiceId;
  scriptureVerseIds: number[];
}): string {
  if (
    !input.translationId ||
    input.scriptureVerseIds.length < 1 ||
    input.scriptureVerseIds.some((id) => !Number.isSafeInteger(id) || id < 1)
  ) {
    throw new SelectionRequestError(
      "invalid_request",
      "A selection hash requires a translation and ordered canonical verses.",
    );
  }
  const identity = JSON.stringify([
    input.translationId,
    input.voiceId,
    input.scriptureVerseIds,
  ]);
  return createHash("sha256").update(identity, "utf8").digest("hex");
}

function isSelectionVoiceId(value: string): value is SelectionVoiceId {
  return (SELECTION_API_VOICES as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
