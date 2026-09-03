import {
  type AudioSelectionItem,
  type AudioSelectionResponse,
  type AudioSelectionStatus,
  type PlaybackVoiceId,
} from "@/components/player/types";

interface AudioSelectionSummary {
  selectionId: string;
  status: AudioSelectionStatus;
  ready: number;
  total: number;
}

export class AudioSelectionClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioSelectionClientError";
  }
}

export async function createAudioSelectionService(
  references: string[],
  voiceId: PlaybackVoiceId,
): Promise<AudioSelectionSummary> {
  const response = await fetch("/api/audio/selections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ references, translationId: "WEB", voiceId }),
  });
  return parseSelectionSummary(response);
}

export async function getAudioSelectionService(
  selectionId: string,
): Promise<AudioSelectionResponse> {
  const response = await fetch(
    `/api/audio/selections/${encodeURIComponent(selectionId)}`,
    { cache: "no-store" },
  );
  return parseSelectionResponse(response);
}

export async function retryAudioSelectionService(
  selectionId: string,
): Promise<AudioSelectionResponse> {
  const response = await fetch(
    `/api/audio/selections/${encodeURIComponent(selectionId)}/retry`,
    { method: "POST" },
  );
  return parseSelectionResponse(response);
}

async function parseSelectionSummary(
  response: Response,
): Promise<AudioSelectionSummary> {
  const value = await readResponse(response);
  if (!isSelectionSummary(value)) {
    throw new AudioSelectionClientError(
      "The audio service returned an invalid selection response.",
    );
  }
  return value;
}

async function parseSelectionResponse(
  response: Response,
): Promise<AudioSelectionResponse> {
  const value = await readResponse(response);
  if (!isSelectionSummary(value) || !Array.isArray(value.items)) {
    throw new AudioSelectionClientError(
      "The audio service returned an invalid playback response.",
    );
  }
  const items = value.items.map(parseSelectionItem);
  return { ...value, items };
}

async function readResponse(response: Response): Promise<unknown> {
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new AudioSelectionClientError(
      "The audio service returned an unreadable response.",
    );
  }
  if (!response.ok) {
    const message =
      isRecord(value) && isRecord(value.error) && typeof value.error.message === "string"
        ? value.error.message
        : "The audio selection could not be prepared.";
    throw new AudioSelectionClientError(message);
  }
  return value;
}

function isSelectionSummary(value: unknown): value is AudioSelectionSummary & Record<string, unknown> {
  return (
    isRecord(value) &&
    typeof value.selectionId === "string" &&
    isSelectionStatus(value.status) &&
    isCount(value.ready) &&
    isCount(value.total) &&
    value.ready <= value.total
  );
}

function parseSelectionItem(value: unknown): AudioSelectionItem {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !isCount(value.position) ||
    typeof value.reference !== "string" ||
    typeof value.url !== "string"
  ) {
    throw new AudioSelectionClientError(
      "The audio service returned an invalid verse item.",
    );
  }
  return {
    id: value.id,
    position: value.position,
    reference: value.reference,
    url: value.url,
  };
}

function isSelectionStatus(value: unknown): value is AudioSelectionStatus {
  return ["preparing", "ready", "partially_failed", "failed"].includes(
    String(value),
  );
}

function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
