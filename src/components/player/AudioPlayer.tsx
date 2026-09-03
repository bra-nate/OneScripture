"use client";

import { useEffect, useRef, useState } from "react";

import {
  getEndedPlaybackIndex,
  shouldRefreshSignedUrls,
} from "@/components/player/playbackSequence";
import { type AudioSelectionItem, type PlaybackPreferences } from "@/components/player/types";
import { Button, Status } from "@/components/ui";

export interface AudioPlayerProps {
  items: AudioSelectionItem[];
  onPreferencesChange: (changes: Partial<PlaybackPreferences>) => void;
  onRefreshItems: () => Promise<AudioSelectionItem[]>;
  preferences: PlaybackPreferences;
}

export function AudioPlayer({
  items,
  onPreferencesChange,
  onRefreshItems,
  preferences,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const signedAtRef = useRef(Date.now());
  const shouldContinueRef = useRef(false);
  const [playbackItems, setPlaybackItems] = useState(items);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentItem = playbackItems[currentIndex];
  const nextItem =
    playbackItems[currentIndex + 1] ??
    (preferences.mode === "loop" ? playbackItems[0] : null);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      shouldContinueRef.current = false;
      audio.pause();
      setIsPlaying(false);
      return;
    }
    try {
      setError(null);
      const didRefresh = await refreshItemsIfNeeded();
      if (didRefresh) {
        shouldContinueRef.current = true;
        return;
      }
      await audio.play();
      shouldContinueRef.current = true;
      setIsPlaying(true);
    } catch {
      setError("Playback could not start. Check your browser audio permissions and try again.");
      setIsPlaying(false);
    }
  }

  function moveTo(index: number, shouldPlay = isPlaying) {
    shouldContinueRef.current = shouldPlay;
    setCurrentIndex(index);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
  }

  async function restartCurrentItem() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    setError(null);
    shouldContinueRef.current = true;
    await audio.play();
    setIsPlaying(true);
  }

  async function handleEnded() {
    const nextIndex = getEndedPlaybackIndex(
      currentIndex,
      playbackItems.length,
      preferences.mode,
    );
    if (nextIndex !== null) {
      const isLoopEdge = nextIndex === 0;
      try {
        const didRefresh = await refreshItemsIfNeeded(isLoopEdge);
        if (nextIndex === currentIndex) {
          if (didRefresh) {
            shouldContinueRef.current = true;
            setCurrentTime(0);
            setDuration(0);
            setError(null);
            return;
          }
          await restartCurrentItem();
          return;
        }
        moveTo(nextIndex, true);
      } catch {
        shouldContinueRef.current = false;
        setIsPlaying(false);
        setError("Playback URLs could not be renewed. Check your connection and select play to retry.");
      }
      return;
    }
    shouldContinueRef.current = false;
    setIsPlaying(false);
  }

  async function refreshItemsIfNeeded(isLoopEdge = false) {
    if (!shouldRefreshSignedUrls(signedAtRef.current, Date.now(), isLoopEdge)) {
      return false;
    }
    const refreshedItems = await onRefreshItems();
    setPlaybackItems(refreshedItems);
    signedAtRef.current = Date.now();
    return true;
  }

  async function moveWithFreshUrls(index: number) {
    try {
      await refreshItemsIfNeeded();
      moveTo(index);
    } catch {
      setError("Playback URLs could not be renewed. Check your connection and try again.");
    }
  }

  async function handleCanPlay() {
    const audio = audioRef.current;
    if (!audio || !shouldContinueRef.current || !audio.paused) return;
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      shouldContinueRef.current = false;
      setIsPlaying(false);
      setError("The next verse could not start automatically. Select play to continue.");
    }
  }

  function seek(value: string) {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = Number(value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = preferences.speed;
    audio.volume = preferences.volume;
  }, [preferences.speed, preferences.volume]);

  useEffect(() => {
    if (!nextItem) return;
    const preload = new Audio();
    preload.preload = "auto";
    preload.src = nextItem.url;
    preload.load();
    return () => {
      preload.removeAttribute("src");
      preload.load();
    };
  }, [nextItem]);

  return (
    <div className="grid gap-5">
      <audio
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={() => setError("This verse audio is temporarily unavailable.")}
        onLoadedMetadata={(event) => {
          event.currentTarget.playbackRate = preferences.speed;
          event.currentTarget.volume = preferences.volume;
          setDuration(event.currentTarget.duration);
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        preload="auto"
        ref={audioRef}
        src={currentItem.url}
      />

      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Verse {currentIndex + 1} of {playbackItems.length}
          </p>
          <p className="mt-1 font-display text-2xl text-text-primary">{currentItem.reference}</p>
          <p className="mt-1 font-sans text-xs text-text-muted">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button aria-label="Previous verse" disabled={currentIndex === 0} onClick={() => moveWithFreshUrls(currentIndex - 1)} size="small" variant="secondary">
            Previous
          </Button>
          <Button aria-label={isPlaying ? "Pause scripture audio" : "Play scripture audio"} onClick={togglePlayback} size="circle">
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button aria-label="Next verse" disabled={currentIndex === playbackItems.length - 1} onClick={() => moveWithFreshUrls(currentIndex + 1)} size="small" variant="secondary">
            Next
          </Button>
        </div>
      </div>

      <input aria-label="Audio progress" className="w-full accent-accent" max={duration || 0} min="0" onChange={(event) => seek(event.target.value)} step="1" type="range" value={Math.min(currentTime, duration || currentTime)} />

      <div className="flex flex-wrap gap-2">
        <Button aria-pressed={preferences.mode === "once"} onClick={() => onPreferencesChange({ mode: "once" })} size="small" variant={preferences.mode === "once" ? "primary" : "secondary"}>
          Play once
        </Button>
        <Button aria-pressed={preferences.mode === "loop"} onClick={() => onPreferencesChange({ mode: "loop" })} size="small" variant={preferences.mode === "loop" ? "primary" : "secondary"}>
          Repeat selection
        </Button>
      </div>

      {error && (
        <Status label="Playback interrupted" role="alert" tone="danger">
          {error}
        </Status>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}
