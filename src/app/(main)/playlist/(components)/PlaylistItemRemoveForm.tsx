"use client";

import { useActionState } from "react";

import { removePlaylistItem } from "@/app/(main)/playlist/actions";
import { Button } from "@/components/ui";
import { INITIAL_PLAYLIST_ACTION_STATE } from "@/lib/playlists/types";

export interface PlaylistItemRemoveFormProps {
  itemId: string;
  playlistId: string;
}

export function PlaylistItemRemoveForm({
  itemId,
  playlistId,
}: PlaylistItemRemoveFormProps) {
  const action = removePlaylistItem.bind(null, playlistId, itemId);
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_PLAYLIST_ACTION_STATE,
  );

  return (
    <form action={formAction} className="text-right">
      <Button isPending={isPending} size="small" type="submit" variant="ghost">
        Remove
      </Button>
      {state.status === "error" && (
        <p aria-live="polite" className="mt-2 max-w-56 font-sans text-xs text-state-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}
