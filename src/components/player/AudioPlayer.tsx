"use client";

import { useEffect, useRef, useState } from "react";

import { Button, Surface } from "@/components/ui";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
  }, [speed]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  function seek(value: string) {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = Number(value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  return (
    <Surface className="p-5" variant="strong">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={togglePlayback}
            size="circle"
            variant="secondary"
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <div>
            <p className="font-sans text-sm font-medium text-text-primary">
              Scripture audio
            </p>
            <p className="font-sans text-xs text-text-muted">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="1"
          value={Math.min(currentTime, duration || currentTime)}
          onChange={(event) => seek(event.target.value)}
          className="w-full accent-accent"
          aria-label="Audio progress"
        />
        <div className="flex flex-wrap gap-2">
          {[0.75, 1, 1.25, 1.5].map((value) => (
            <Button
              key={value}
              type="button"
              onClick={() => setSpeed(value)}
              aria-pressed={value === speed}
              size="small"
              variant={value === speed ? "primary" : "secondary"}
            >
              {value}x
            </Button>
          ))}
        </div>
      </div>
    </Surface>
  );
}
