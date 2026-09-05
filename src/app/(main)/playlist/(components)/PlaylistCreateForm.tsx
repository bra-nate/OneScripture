"use client";

import { useActionState } from "react";

import { createPlaylist } from "@/app/(main)/playlist/actions";
import { Button, Field, Status } from "@/components/ui";
import { INITIAL_PLAYLIST_ACTION_STATE } from "@/lib/playlists/types";

export function PlaylistCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createPlaylist,
    INITIAL_PLAYLIST_ACTION_STATE,
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <Field
        hint="You can add verses from any Bible chapter after creating it."
        label="Playlist name"
        name="name"
      >
        <Field.Input
          autoComplete="off"
          maxLength={80}
          name="name"
          placeholder="Morning encouragement"
          required
        />
      </Field>
      <Button className="sm:mb-7" isPending={isPending} type="submit">
        Create playlist
      </Button>
      {state.status === "error" && (
        <Status className="sm:col-span-2" label="Playlist not created" tone="danger">
          {state.message}
        </Status>
      )}
    </form>
  );
}
