import { type PlaybackMode } from "@/components/player/types";

export const SIGNED_URL_REFRESH_AGE_MS = 4 * 60 * 1_000;
export const SIGNED_URL_LOOP_REFRESH_AGE_MS = 3 * 60 * 1_000;

export function getEndedPlaybackIndex(
  currentIndex: number,
  itemCount: number,
  mode: PlaybackMode,
): number | null {
  if (!Number.isSafeInteger(currentIndex) || currentIndex < 0) return null;
  if (!Number.isSafeInteger(itemCount) || itemCount < 1) return null;
  if (currentIndex + 1 < itemCount) return currentIndex + 1;
  return mode === "loop" ? 0 : null;
}

export function shouldRefreshSignedUrls(
  signedAt: number,
  now: number,
  isLoopEdge = false,
): boolean {
  const age = now - signedAt;
  return isLoopEdge
    ? age >= SIGNED_URL_LOOP_REFRESH_AGE_MS
    : age >= SIGNED_URL_REFRESH_AGE_MS;
}
