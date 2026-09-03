import {
  PLAYBACK_SPEEDS,
  PLAYBACK_VOICES,
  type PlaybackPreferences,
  type PlaybackSpeed,
  type PlaybackVoiceId,
} from "@/components/player/types";

export const PLAYBACK_PREFERENCES_KEY =
  "onescripture:playback-preferences:v1";

export const DEFAULT_PLAYBACK_PREFERENCES: PlaybackPreferences = {
  mode: "once",
  speed: 1,
  voiceId: "af_heart",
  volume: 1,
};

export function readPlaybackPreferences(
  storage: Pick<Storage, "getItem">,
): PlaybackPreferences {
  try {
    const stored = storage.getItem(PLAYBACK_PREFERENCES_KEY);
    if (!stored) return DEFAULT_PLAYBACK_PREFERENCES;
    const value = JSON.parse(stored) as unknown;
    if (!isRecord(value)) return DEFAULT_PLAYBACK_PREFERENCES;

    return {
      mode: value.mode === "loop" ? "loop" : "once",
      speed: isPlaybackSpeed(value.speed) ? value.speed : 1,
      voiceId: isPlaybackVoice(value.voiceId) ? value.voiceId : "af_heart",
      volume: isVolume(value.volume) ? value.volume : 1,
    };
  } catch {
    return DEFAULT_PLAYBACK_PREFERENCES;
  }
}

export function writePlaybackPreferences(
  storage: Pick<Storage, "setItem">,
  preferences: PlaybackPreferences,
): void {
  storage.setItem(PLAYBACK_PREFERENCES_KEY, JSON.stringify(preferences));
}

function isPlaybackSpeed(value: unknown): value is PlaybackSpeed {
  return (PLAYBACK_SPEEDS as readonly unknown[]).includes(value);
}

function isPlaybackVoice(value: unknown): value is PlaybackVoiceId {
  return (PLAYBACK_VOICES as readonly unknown[]).includes(value);
}

function isVolume(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
