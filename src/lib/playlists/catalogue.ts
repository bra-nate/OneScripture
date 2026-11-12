import "server-only";

import { PlaylistError } from "@/lib/playlists/errors";
import { type PlaylistDetail, type PlaylistItem, type PlaylistSummary } from "@/lib/playlists/types";
import { createClient } from "@/lib/supabase/server";

interface PlaylistRow {
  id: string;
  name: string;
}

interface PlaylistItemRow {
  id: string;
  playlist_id: string;
  book_id: string;
  chapter: number;
  verse_start: number | null;
  verse_end: number | null;
  translation_id: string;
  display_ref: string;
  order: number;
}

export async function getOwnedPlaylistSummaries(): Promise<PlaylistSummary[]> {
  const { supabase, userId } = await getPlaylistClient();

  const { data: playlists, error } = await supabase
    .from("playlists")
    .select("id, name")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .returns<PlaylistRow[]>();
  if (error) throw unavailableError("Playlist summaries could not be loaded.", error);
  if (!playlists?.length) return [];

  const { data: items, error: itemsError } = await supabase
    .from("playlist_items")
    .select("playlist_id")
    .in("playlist_id", playlists.map(({ id }) => id))
    .returns<Array<{ playlist_id: string }>>();
  if (itemsError) throw unavailableError("Playlist counts could not be loaded.", itemsError);

  const counts = new Map<string, number>();
  for (const item of items ?? []) {
    counts.set(item.playlist_id, (counts.get(item.playlist_id) ?? 0) + 1);
  }

  return playlists.map((playlist) => ({
    id: playlist.id,
    name: playlist.name,
    itemCount: counts.get(playlist.id) ?? 0,
  }));
}

export async function getOwnedPlaylistDetail(playlistId: string): Promise<PlaylistDetail | null> {
  const { supabase, userId } = await getPlaylistClient();

  const { data: playlists, error } = await supabase
    .from("playlists")
    .select("id, name")
    .eq("id", playlistId)
    .eq("user_id", userId)
    .limit(1)
    .returns<PlaylistRow[]>();
  if (error) throw unavailableError("The playlist could not be loaded.", error);
  if (!playlists?.[0]) return null;

  const { data: items, error: itemsError } = await supabase
    .from("playlist_items")
    .select("id, playlist_id, book_id, chapter, verse_start, verse_end, translation_id, display_ref, order")
    .eq("playlist_id", playlistId)
    .order("order", { ascending: true })
    .returns<PlaylistItemRow[]>();
  if (itemsError) throw unavailableError("The playlist items could not be loaded.", itemsError);

  return {
    id: playlists[0].id,
    name: playlists[0].name,
    items: (items ?? []).map(mapPlaylistItem),
  };
}

async function getPlaylistClient() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw unavailableError("The playlist session could not be verified.", error);
    if (!user) throw new PlaylistError("unauthorized", "A signed-in user is required.");
    return { supabase, userId: user.id };
  } catch (error) {
    if (error instanceof PlaylistError) throw error;
    throw unavailableError("The playlist service could not be reached.", error);
  }
}

function unavailableError(message: string, cause: unknown): PlaylistError {
  return new PlaylistError("unavailable", message, { cause });
}

function mapPlaylistItem(row: PlaylistItemRow): PlaylistItem {
  return {
    id: row.id,
    displayReference: row.display_ref,
    position: row.order,
    reference: {
      bookId: row.book_id,
      chapter: row.chapter,
      verseStart: row.verse_start,
      verseEnd: row.verse_end,
    },
    translationId: row.translation_id,
  };
}
