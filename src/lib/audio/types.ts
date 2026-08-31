export const AUDIO_BUCKET = "scripture-audio";
export const AUDIO_MIME_TYPE = "audio/mpeg";

export type AudioAssetStatus = "pending" | "generating" | "ready" | "failed";
export type AudioGenerationJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed";
export type AudioSelectionStatus =
  | "preparing"
  | "ready"
  | "partially_failed"
  | "failed";

export interface AudioAssetIdentity {
  scriptureVerseId: number;
  voiceId: string;
  modelId: string;
  modelVersion: string;
  textHash: string;
}

export interface AudioVerseAsset extends AudioAssetIdentity {
  id: string;
  storagePath: string | null;
  mimeType: string | null;
  durationMs: number | null;
  status: AudioAssetStatus;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface ReadyAudioAssetInput {
  storagePath: string;
  durationMs: number;
}

export interface AudioStoragePathInput {
  translationCode: string;
  modelVersion: string;
  voiceId: string;
  bookId: string;
  chapter: number;
  verse: number;
}
