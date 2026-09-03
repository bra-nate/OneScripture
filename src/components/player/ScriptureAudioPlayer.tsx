"use client";

import { AudioPlayer } from "@/components/player/AudioPlayer";
import { PlayerPreferences } from "@/components/player/PlayerPreferences";
import { type PlaybackPreferences } from "@/components/player/types";
import { useAudioSelection } from "@/components/player/useAudioSelection";
import { usePlaybackPreferences } from "@/components/player/usePlaybackPreferences";
import { Button, Status, Surface } from "@/components/ui";

export interface ScriptureAudioPlayerProps {
  references: string[];
  title?: string;
}

export function ScriptureAudioPlayer({ references, title = "Scripture audio" }: ScriptureAudioPlayerProps) {
  const { preferences, updatePreferences } = usePlaybackPreferences();
  const { prepare, refreshItems, reset, retry, state } = useAudioSelection(references);

  function handlePreferencesChange(changes: Partial<PlaybackPreferences>) {
    if (changes.voiceId && changes.voiceId !== preferences.voiceId) reset();
    updatePreferences(changes);
  }

  return (
    <Surface className="grid gap-5 p-5 md:p-7" variant="strong">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-accent">Ordered listening</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">{title}</h2>
          <p className="mt-2 font-sans text-sm leading-6 text-text-muted">
            {references.length} {references.length === 1 ? "passage" : "passages"} in this selection
          </p>
        </div>
        {state.status === "idle" && references.length > 0 && (
          <Button onClick={() => prepare(preferences.voiceId)}>Prepare audio</Button>
        )}
      </div>

      {references.length === 0 && (
        <Status label="No scripture selected" tone="neutral">
          Add at least one scripture reference before preparing audio.
        </Status>
      )}

      {state.status === "preparing" && (
        <Status label="Preparing scripture audio" tone="information">
          {state.ready} of {state.total} verses are ready. This page will update automatically.
        </Status>
      )}

      {state.status === "error" && (
        <Status label="Audio preparation paused" role="alert" tone="danger">
          <p>{state.message}</p>
          <Button
            className="mt-3"
            onClick={state.selectionId ? retry : () => prepare(preferences.voiceId)}
            size="small"
            variant="secondary"
          >
            {state.selectionId ? "Retry incomplete audio" : "Try again"}
          </Button>
        </Status>
      )}

      {state.status === "ready" && state.items.length > 0 && (
        <AudioPlayer
          items={state.items}
          key={state.selectionId}
          onPreferencesChange={handlePreferencesChange}
          onRefreshItems={refreshItems}
          preferences={preferences}
        />
      )}

      {state.status === "ready" && state.items.length === 0 && (
        <Status label="No playable verses" tone="warning">
          The selection finished without any playable audio items.
        </Status>
      )}

      <PlayerPreferences onChange={handlePreferencesChange} preferences={preferences} />
    </Surface>
  );
}
