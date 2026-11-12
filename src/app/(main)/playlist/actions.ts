"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { formatDisplayRef, serializePassageRef } from "@/lib/bible/reference";
import {
  getNextPlaylistPosition,
  hasPlaylistVerse,
  type PositionedPlaylistItem,
} from "@/lib/playlists/integrity";
import { type PlaylistActionState } from "@/lib/playlists/types";
import { parseSingleVerseReference, validatePlaylistName } from "@/lib/playlists/validation";
import { MAX_SELECTION_VERSES } from "@/lib/scripture/selections";
import { createClient } from "@/lib/supabase/server";

export async function createPlaylist(
  _state: PlaylistActionState,
  formData: FormData,
): Promise<PlaylistActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const validationError = validatePlaylistName(name);
  if (validationError) return { message: validationError, status: "error" };

  const context = await getPlaylistActionContext("Sign in to create a playlist.");
  if ("state" in context) return context.state;

  const { data, error } = await context.supabase
    .from("playlists")
    .insert({ name, user_id: context.userId })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) {
    return { message: "The playlist could not be created. Try again.", status: "error" };
  }

  redirect(routes.playlists.detail(data.id));
}

export async function addVerseToPlaylist(
  referenceValue: string,
  _state: PlaylistActionState,
  formData: FormData,
): Promise<PlaylistActionState> {
  const playlistId = String(formData.get("playlistId") ?? "");
  const reference = parseSingleVerseReference(referenceValue);
  if (!reference || !playlistId) {
    return { message: "Choose a valid playlist and verse.", status: "error" };
  }

  const context = await getPlaylistActionContext("Sign in to save this verse.");
  if ("state" in context) return context.state;

  const { data: playlists, error: playlistError } = await context.supabase
    .from("playlists")
    .select("id")
    .eq("id", playlistId)
    .eq("user_id", context.userId)
    .limit(1)
    .returns<Array<{ id: string }>>();
  if (playlistError) return unavailableState("The playlist could not be checked. Try again.");
  if (!playlists?.[0]) return { message: "That playlist is not available.", status: "error" };

  const { data: itemRows, error: itemsError } = await context.supabase
    .from("playlist_items")
    .select("book_id, chapter, verse_start, translation_id, order")
    .eq("playlist_id", playlistId)
    .returns<Array<{
      book_id: string;
      chapter: number;
      verse_start: number;
      translation_id: string;
      order: number;
    }>>();
  if (itemsError) return unavailableState("The playlist could not be checked. Try again.");

  const items: PositionedPlaylistItem[] = (itemRows ?? []).map((item) => ({
    bookId: item.book_id,
    chapter: item.chapter,
    position: item.order,
    translationId: item.translation_id,
    verse: item.verse_start,
  }));
  if (hasPlaylistVerse(items, reference, "WEB")) {
    return { message: "This verse is already in that playlist.", status: "error" };
  }
  if (items.length >= MAX_SELECTION_VERSES) {
    return {
      message: `A playlist can contain at most ${MAX_SELECTION_VERSES} scriptures.`,
      status: "error",
    };
  }
  const { error } = await context.supabase.from("playlist_items").insert({
    playlist_id: playlistId,
    book_id: reference.bookId,
    chapter: reference.chapter,
    verse_start: reference.verseStart,
    verse_end: null,
    translation_id: "WEB",
    display_ref: formatDisplayRef(reference, "WEB"),
    order: getNextPlaylistPosition(items),
  });
  if (error?.code === "23505") {
    return { message: "This verse is already in that playlist.", status: "error" };
  }
  if (error) return unavailableState("This verse could not be added. Try again.");

  revalidatePath(routes.playlists.index);
  revalidatePath(routes.playlists.detail(playlistId));
  return {
    message: `${serializePassageRef(reference)} added to your playlist.`,
    status: "success",
  };
}

export async function removePlaylistItem(
  playlistId: string,
  itemId: string,
  _state: PlaylistActionState,
): Promise<PlaylistActionState> {
  void _state;
  const context = await getPlaylistActionContext("Sign in to update this playlist.");
  if ("state" in context) return context.state;

  const { data: playlists, error: playlistError } = await context.supabase
    .from("playlists")
    .select("id")
    .eq("id", playlistId)
    .eq("user_id", context.userId)
    .limit(1)
    .returns<Array<{ id: string }>>();
  if (playlistError) return unavailableState("The playlist could not be checked. Try again.");
  if (!playlists?.[0]) {
    return { message: "That playlist is not available.", status: "error" };
  }

  const { data: deletedItems, error } = await context.supabase
    .from("playlist_items")
    .delete()
    .eq("id", itemId)
    .eq("playlist_id", playlistId)
    .select("id")
    .returns<Array<{ id: string }>>();
  if (error) return unavailableState("This scripture could not be removed. Try again.");
  if (!deletedItems?.length) {
    return { message: "That scripture is no longer in this playlist.", status: "error" };
  }

  revalidatePath(routes.playlists.index);
  revalidatePath(routes.playlists.detail(playlistId));
  redirect(`${routes.playlists.detail(playlistId)}?updated=removed`);
}

type PlaylistActionContext =
  | { supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { state: PlaylistActionState };

async function getPlaylistActionContext(signInMessage: string): Promise<PlaylistActionContext> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return { state: unavailableState("Your session could not be verified. Try again.") };
    if (!user) return { state: { message: signInMessage, status: "error" } };
    return { supabase, userId: user.id };
  } catch {
    return { state: unavailableState("The playlist service is temporarily unavailable.") };
  }
}

function unavailableState(message: string): PlaylistActionState {
  return { message, status: "error" };
}
