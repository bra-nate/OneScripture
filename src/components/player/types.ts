export const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5] as const;
export const PLAYBACK_VOICES = ["af_heart", "am_michael"] as const;

export type PlaybackMode = "once" | "loop";
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];
export type PlaybackVoiceId = (typeof PLAYBACK_VOICES)[number];

export interface PlaybackPreferences {
  mode: PlaybackMode;
  speed: PlaybackSpeed;
  voiceId: PlaybackVoiceId;
  volume: number;
}

export interface AudioSelectionItem {
  id: string;
  position: number;
  reference: string;
  url: string;
}

export type AudioSelectionStatus =
  | "preparing"
  | "ready"
  | "partially_failed"
  | "failed";

export interface AudioSelectionResponse {
  selectionId: string;
  status: AudioSelectionStatus;
  ready: number;
  total: number;
  items: AudioSelectionItem[];
}
