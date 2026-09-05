"use client";

import { useState } from "react";

import { AudioPlayer } from "@/components/player/AudioPlayer";
import { PlayerPreferences } from "@/components/player/PlayerPreferences";
import { type PlaybackPreferences } from "@/components/player/types";
import { useAudioSelection } from "@/components/player/useAudioSelection";
import { usePlaybackPreferences } from "@/components/player/usePlaybackPreferences";
import { Button, Status, Surface } from "@/components/ui";

export interface ScriptureAudioPlayerProps {
  onCurrentReferenceChange?: (reference: string | null) => void;
  references: string[];
  title?: string;
}

export function ScriptureAudioPlayer({
  onCurrentReferenceChange,
  references,
  title = "Scripture audio",
}: ScriptureAudioPlayerProps) {
  const { preferences, updatePreferences } = usePlaybackPreferences();
  const { prepare, refreshItems, retry, state } = useAudioSelection(references);
  const [didRequestPlayback, setDidRequestPlayback] = useState(false);

  function handleListen() {
    setDidRequestPlayback(true);
    void prepare(preferences.voiceId);
  }

  function handlePreferencesChange(changes: Partial<PlaybackPreferences>) {
    const isVoiceChange =
      Boolean(changes.voiceId) && changes.voiceId !== preferences.voiceId;
    updatePreferences(changes);
    // A different voice is a different set of assets — re-prepare rather than
    // silently dropping the user back to an idle player.
    if (isVoiceChange && state.status !== "idle" && changes.voiceId) {
      void prepare(changes.voiceId);
    }
  }

  return (
    <Surface className="grid gap-5 p-5 md:p-7" variant="strong">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-label text-accent">
            Ordered listening
          </p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">{title}</h2>
          <p className="mt-2 font-sans text-sm leading-6 text-text-muted">
            {references.length} {references.length === 1 ? "passage" : "passages"} in this selection
          </p>
        </div>
        {state.status === "idle" && references.length > 0 && (
          <Button onClick={handleListen}>Listen</Button>
        )}
      </div>

      {references.length === 0 && (
        <Status label="No scripture selected" tone="neutral">
          Add at least one scripture reference before listening.
        </Status>
      )}

      {state.status === "preparing" && (
        <Status label="Narrating this selection" tone="information">
          <p>
            {state.ready} of {state.total} verses ready. Playback starts on its
            own — the first listen for a passage has to be generated once, then
            it is reused.
          </p>
          <progress
            className="mt-3 h-1.5 w-full"
            max={state.total || 1}
            value={state.ready}
          >
            {state.ready} of {state.total} verses ready
          </progress>
        </Status>
      )}

      {state.status === "error" && (
        <Status label="Audio preparation paused" role="alert" tone="danger">
          <p>{state.message}</p>
          <Button
            className="mt-3"
            onClick={state.selectionId ? retry : handleListen}
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
          onCurrentReferenceChange={onCurrentReferenceChange}
          onPreferencesChange={handlePreferencesChange}
          onRefreshItems={refreshItems}
          preferences={preferences}
          shouldAutoPlay={didRequestPlayback}
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
