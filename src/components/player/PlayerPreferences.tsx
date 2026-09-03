import { Button } from "@/components/ui";
import {
  PLAYBACK_SPEEDS,
  type PlaybackPreferences,
} from "@/components/player/types";

export interface PlayerPreferencesProps {
  onChange: (changes: Partial<PlaybackPreferences>) => void;
  preferences: PlaybackPreferences;
}

export function PlayerPreferences({
  onChange,
  preferences,
}: PlayerPreferencesProps) {
  return (
    <div className="grid gap-5 border-t border-border pt-5 md:grid-cols-3">
      <fieldset>
        <legend className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
          Voice
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            aria-pressed={preferences.voiceId === "af_heart"}
            onClick={() => onChange({ voiceId: "af_heart" })}
            size="small"
            variant={preferences.voiceId === "af_heart" ? "primary" : "secondary"}
          >
            Female
          </Button>
          <Button
            aria-pressed={preferences.voiceId === "am_michael"}
            onClick={() => onChange({ voiceId: "am_michael" })}
            size="small"
            variant={preferences.voiceId === "am_michael" ? "primary" : "secondary"}
          >
            Male
          </Button>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
          Speed
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLAYBACK_SPEEDS.map((speed) => (
            <Button
              aria-pressed={preferences.speed === speed}
              key={speed}
              onClick={() => onChange({ speed })}
              size="small"
              variant={preferences.speed === speed ? "primary" : "secondary"}
            >
              {speed}×
            </Button>
          ))}
        </div>
      </fieldset>

      <label className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        Volume {Math.round(preferences.volume * 100)}%
        <input
          aria-label="Playback volume"
          className="mt-4 w-full accent-accent"
          max="1"
          min="0"
          onChange={(event) => onChange({ volume: Number(event.target.value) })}
          step="0.05"
          type="range"
          value={preferences.volume}
        />
      </label>
    </div>
  );
}
