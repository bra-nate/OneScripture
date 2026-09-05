"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { formatDisplayRef, serializePassageRef } from "@/lib/bible/reference";
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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: "Sign in to create a playlist.", status: "error" };

  const { data, error } = await supabase
    .from("playlists")
    .insert({ name, user_id: user.id })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) {
    return { message: "The playlist could not be created. Try again.", status: "error" };
  }

  redirect(`/playlist/${data.id}`);
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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: "Sign in to save this verse.", status: "error" };

  const { data: playlists } = await supabase
    .from("playlists")
    .select("id")
    .eq("id", playlistId)
    .eq("user_id", user.id)
    .limit(1)
    .returns<Array<{ id: string }>>();
  if (!playlists?.[0]) return { message: "That playlist is not available.", status: "error" };

  const { count, data: lastItems } = await supabase
    .from("playlist_items")
    .select("order", { count: "exact" })
    .eq("playlist_id", playlistId)
    .order("order", { ascending: false })
    .limit(1)
    .returns<Array<{ order: number }>>();
  if ((count ?? 0) >= MAX_SELECTION_VERSES) {
    return {
      message: `A playlist can contain at most ${MAX_SELECTION_VERSES} scriptures.`,
      status: "error",
    };
  }
  const { error } = await supabase.from("playlist_items").insert({
    playlist_id: playlistId,
    book_id: reference.bookId,
    chapter: reference.chapter,
    verse_start: reference.verseStart,
    verse_end: null,
    translation_id: "WEB",
    display_ref: formatDisplayRef(reference, "WEB"),
    order: (lastItems?.[0]?.order ?? -1) + 1,
  });
  if (error) return { message: "This verse could not be added. Try again.", status: "error" };

  revalidatePath("/playlist");
  revalidatePath(`/playlist/${playlistId}`);
  return {
    message: `${serializePassageRef(reference)} added to your playlist.`,
    status: "success",
  };
}

export async function removePlaylistItem(playlistId: string, itemId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: playlists } = await supabase
    .from("playlists")
    .select("id")
    .eq("id", playlistId)
    .eq("user_id", user.id)
    .limit(1)
    .returns<Array<{ id: string }>>();
  if (!playlists?.[0]) return;

  await supabase.from("playlist_items").delete().eq("id", itemId).eq("playlist_id", playlistId);
  revalidatePath("/playlist");
  revalidatePath(`/playlist/${playlistId}`);
}
