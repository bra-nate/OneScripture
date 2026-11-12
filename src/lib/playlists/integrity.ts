import { type PassageRef } from "@/lib/bible/reference";

export interface PlaylistVerseIdentity {
  bookId: string;
  chapter: number;
  translationId: string;
  verse: number;
}

export interface PositionedPlaylistItem extends PlaylistVerseIdentity {
  position: number;
}

export function hasPlaylistVerse(
  items: PlaylistVerseIdentity[],
  reference: PassageRef,
  translationId: string,
): boolean {
  return items.some(
    (item) =>
      item.bookId === reference.bookId &&
      item.chapter === reference.chapter &&
      item.verse === reference.verseStart &&
      item.translationId === translationId,
  );
}

export function getNextPlaylistPosition(items: PositionedPlaylistItem[]): number {
  return items.reduce((highest, item) => Math.max(highest, item.position), -1) + 1;
}
