"use client";

import { useEffect, useRef, useState } from "react";

import {
  getEndedPlaybackIndex,
  shouldRefreshSignedUrls,
} from "@/components/player/playbackSequence";
import { type AudioSelectionItem, type PlaybackPreferences } from "@/components/player/types";
import { VerseAudioCache } from "@/components/player/verseAudioCache";
import { Button, Range, Status } from "@/components/ui";

export interface AudioPlayerProps {
  items: AudioSelectionItem[];
  onCurrentReferenceChange?: (reference: string | null) => void;
  onPreferencesChange: (changes: Partial<PlaybackPreferences>) => void;
  onRefreshItems: () => Promise<AudioSelectionItem[]>;
  preferences: PlaybackPreferences;
  /** Start as soon as the first item can play, for a play-initiated selection. */
  shouldAutoPlay?: boolean;
}

export function AudioPlayer({
  items,
  onCurrentReferenceChange,
  onPreferencesChange,
  onRefreshItems,
  preferences,
  shouldAutoPlay = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const signedAtRef = useRef(Date.now());
  const shouldContinueRef = useRef(shouldAutoPlay);
  const reportReferenceRef = useRef(onCurrentReferenceChange);
  reportReferenceRef.current = onCurrentReferenceChange;
  const [playbackItems, setPlaybackItems] = useState(items);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCache] = useState(() => new VerseAudioCache());
  const [, setCacheVersion] = useState(0);
  const currentItem = playbackItems[currentIndex];
  const currentSource = currentItem ? audioCache.sourceFor(currentItem) : undefined;

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
    // Once every verse is held locally, signed URLs are never used again.
    if (audioCache.hasAll(playbackItems)) return false;
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
    const controller = new AbortController();
    void audioCache.download(playbackItems, currentIndex, controller.signal, () =>
      setCacheVersion((version) => version + 1),
    );
    return () => controller.abort();
  }, [audioCache, playbackItems, currentIndex]);

  useEffect(() => () => audioCache.clear(), [audioCache]);

  const currentReference = currentItem?.reference ?? null;
  useEffect(() => {
    reportReferenceRef.current?.(currentReference);
  }, [currentReference]);

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
        src={currentSource}
      />

      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-label text-accent">
            Verse {currentIndex + 1} of {playbackItems.length}
          </p>
          <p className="mt-1 font-display text-2xl text-text-primary">{currentItem.reference}</p>
          <p className="mt-1 font-sans text-xs text-text-muted">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button aria-label="Previous verse" disabled={currentIndex === 0} onClick={() => moveWithFreshUrls(currentIndex - 1)} size="circle" variant="secondary">
            <PreviousIcon />
          </Button>
          <Button aria-label={isPlaying ? "Pause scripture audio" : "Play scripture audio"} disabled={!currentSource} onClick={togglePlayback} size="circle">
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </Button>
          <Button aria-label="Next verse" disabled={currentIndex === playbackItems.length - 1} onClick={() => moveWithFreshUrls(currentIndex + 1)} size="circle" variant="secondary">
            <NextIcon />
          </Button>
        </div>
      </div>

      <Range aria-label="Audio progress" aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`} disabled={!duration} max={duration || 0} min="0" onChange={(event) => seek(event.target.value)} step="1" value={Math.min(currentTime, duration || currentTime)} />

      <div className="flex flex-wrap gap-2">
        <Button aria-pressed={preferences.mode === "once"} onClick={() => onPreferencesChange({ mode: "once" })} size="small" variant={preferences.mode === "once" ? "selected" : "secondary"}>
          Play once
        </Button>
        <Button aria-pressed={preferences.mode === "loop"} onClick={() => onPreferencesChange({ mode: "loop" })} size="small" variant={preferences.mode === "loop" ? "selected" : "secondary"}>
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

function TransportIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="currentColor"
      focusable="false"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

function PlayIcon() {
  return (
    <TransportIcon>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.79-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14Z" />
    </TransportIcon>
  );
}

function PauseIcon() {
  return (
    <TransportIcon>
      <path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" />
    </TransportIcon>
  );
}

function PreviousIcon() {
  return (
    <TransportIcon>
      <path d="M7 5h2.5v14H7zM20 5.9v12.2a1 1 0 0 1-1.54.84l-9.2-6.1a1 1 0 0 1 0-1.68l9.2-6.1A1 1 0 0 1 20 5.9Z" />
    </TransportIcon>
  );
}

function NextIcon() {
  return (
    <TransportIcon>
      <path d="M14.5 5H17v14h-2.5zM4 5.9v12.2a1 1 0 0 0 1.54.84l9.2-6.1a1 1 0 0 0 0-1.68l-9.2-6.1A1 1 0 0 0 4 5.9Z" />
    </TransportIcon>
  );
}
