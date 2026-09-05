import { VersePlaylistAction } from "@/app/passage/[bookId]/[chapter]/(components)/VersePlaylistAction";
import { Button } from "@/components/ui";
import { getBook } from "@/lib/bible/reference";
import { type PlaylistSummary } from "@/lib/playlists/types";
import { type ScriptureVerse } from "@/lib/scripture/types";

export interface VerseListProps {
  isSignedIn: boolean;
  onListen: (reference: string) => void;
  playlists: PlaylistSummary[];
  verses: ScriptureVerse[];
}

export function VerseList({ isSignedIn, onListen, playlists, verses }: VerseListProps) {
  return (
    <ol className="space-y-5" aria-label="Scripture verses">
      {verses.map((verse) => (
        <li
          id={`verse-${verse.verse}`}
          key={verse.id}
          className="grid grid-cols-[2rem_1fr] gap-3 border-b border-border pb-5 last:border-b-0"
        >
          <span
            aria-hidden="true"
            className="pt-1 font-sans text-xs font-semibold text-accent"
          >
            {verse.verse}
          </span>
          <div>
            <p className="font-serif text-lg leading-8 text-text-primary">
              {verse.text || (
                <span className="italic text-text-muted">
                  Text not present in this edition.
                </span>
              )}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                aria-label={`Listen to ${formatVerseReference(verse)}`}
                onClick={() => onListen(formatVerseReference(verse))}
                size="small"
                variant="secondary"
              >
                Listen to verse
              </Button>
              <VersePlaylistAction
                isSignedIn={isSignedIn}
                playlists={playlists}
                reference={formatVerseReference(verse)}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function formatVerseReference(verse: ScriptureVerse): string {
  return `${getBook(verse.bookId)?.name ?? verse.bookId} ${verse.chapter}:${verse.verse}`;
}
