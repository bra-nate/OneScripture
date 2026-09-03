"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_PLAYBACK_PREFERENCES,
  readPlaybackPreferences,
  writePlaybackPreferences,
} from "@/components/player/preferences";
import { type PlaybackPreferences } from "@/components/player/types";

export interface UsePlaybackPreferencesReturn {
  preferences: PlaybackPreferences;
  updatePreferences: (changes: Partial<PlaybackPreferences>) => void;
}

export function usePlaybackPreferences(): UsePlaybackPreferencesReturn {
  const [preferences, setPreferences] = useState(DEFAULT_PLAYBACK_PREFERENCES);
  const [isHydrated, setIsHydrated] = useState(false);

  function updatePreferences(changes: Partial<PlaybackPreferences>) {
    setPreferences((current) => ({ ...current, ...changes }));
  }

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setPreferences(readPlaybackPreferences(window.localStorage));
      setIsHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    writePlaybackPreferences(window.localStorage, preferences);
  }, [isHydrated, preferences]);

  return { preferences, updatePreferences };
}
