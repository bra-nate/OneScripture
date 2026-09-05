"use client";

import { useActionState, useId } from "react";

import { addVerseToPlaylist } from "@/app/(main)/playlist/actions";
import { Button, ButtonLink } from "@/components/ui";
import { routes } from "@/config/routes";
import { INITIAL_PLAYLIST_ACTION_STATE, type PlaylistSummary } from "@/lib/playlists/types";

export interface VersePlaylistActionProps {
  isSignedIn: boolean;
  playlists: PlaylistSummary[];
  reference: string;
}

export function VersePlaylistAction({
  isSignedIn,
  playlists,
  reference,
}: VersePlaylistActionProps) {
  const action = addVerseToPlaylist.bind(null, reference);
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_PLAYLIST_ACTION_STATE,
  );
  const selectId = useId();

  if (!isSignedIn) {
    return (
      <ButtonLink href={routes.login} size="small" variant="ghost">
        Sign in to save
      </ButtonLink>
    );
  }

  if (playlists.length === 0) {
    return (
      <ButtonLink href={routes.playlists.index} size="small" variant="ghost">
        Create a playlist
      </ButtonLink>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={selectId}>
        Playlist for {reference}
      </label>
      <select
        className="min-h-11 max-w-44 rounded-control border border-border bg-surface px-3 font-sans text-xs text-text-primary"
        defaultValue={playlists[0].id}
        id={selectId}
        name="playlistId"
      >
        {playlists.map((playlist) => (
          <option key={playlist.id} value={playlist.id}>
            {playlist.name}
          </option>
        ))}
      </select>
      <Button
        aria-label={`Add ${reference} to playlist`}
        isPending={isPending}
        size="small"
        type="submit"
        variant="secondary"
      >
        Add
      </Button>
      {state.message && (
        <span
          aria-live="polite"
          className={state.status === "error" ? "text-xs text-state-danger" : "text-xs text-text-muted"}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
