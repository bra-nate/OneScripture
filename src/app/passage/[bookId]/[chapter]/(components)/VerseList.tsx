import { VersePlaylistAction } from "@/app/passage/[bookId]/[chapter]/(components)/VersePlaylistAction";
import { Button } from "@/components/ui";
import { classNames } from "@/components/ui/classNames";
import { getBook } from "@/lib/bible/reference";
import { type PlaylistSummary } from "@/lib/playlists/types";
import { type ScriptureVerse } from "@/lib/scripture/types";

export interface VerseListProps {
  activeReference: string | null;
  arePlaylistsAvailable: boolean;
  isSignedIn: boolean;
  onListen: (reference: string) => void;
  onToggleVerse: (verse: number, isRangeExtend: boolean) => void;
  playlists: PlaylistSummary[];
  selectedVerses: ReadonlySet<number>;
  verses: ScriptureVerse[];
}

export function VerseList({
  activeReference,
  arePlaylistsAvailable,
  isSignedIn,
  onListen,
  onToggleVerse,
  playlists,
  selectedVerses,
  verses,
}: VerseListProps) {
  return (
    <ol className="overflow-hidden rounded-[2rem] bg-surface px-3 md:px-5" aria-label="Scripture verses">
      {verses.map((verse) => {
        const reference = formatVerseReference(verse);
        const isActive = activeReference === reference;
        const isSelected = selectedVerses.has(verse.verse);

        return (
          <li
            aria-current={isActive ? "true" : undefined}
            id={`verse-${verse.verse}`}
            key={verse.id}
            className={classNames(
              "grid grid-cols-[auto_1.75rem_1fr] gap-3 border-b border-border px-3 py-5 transition-colors last:border-b-0 md:py-6",
              isActive && "bg-highlight",
            )}
          >
            <input
              aria-label={`Select ${reference}`}
              checked={isSelected}
              className="mt-1.5 size-4 accent-accent"
              onChange={() => undefined}
              onClick={(event) => onToggleVerse(verse.verse, event.shiftKey)}
              type="checkbox"
            />
            <span
              className={classNames(
                "pt-1 font-sans text-xs font-semibold",
                isActive ? "text-text-primary" : "text-accent",
              )}
            >
              {verse.verse}
            </span>
            <div>
              <p className="font-display text-lg leading-8 text-text-primary md:text-xl md:leading-9">
                {verse.text || (
                  <span className="italic text-text-muted">
                    Text not present in this edition.
                  </span>
                )}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  aria-label={`Listen to ${reference}`}
                  onClick={() => onListen(reference)}
                  size="small"
                  variant={isActive ? "selected" : "secondary"}
                >
                  {isActive ? "Now playing" : "Listen to verse"}
                </Button>
                {arePlaylistsAvailable && (
                  <VersePlaylistAction
                    isSignedIn={isSignedIn}
                    playlists={playlists}
                    reference={reference}
                  />
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function formatVerseReference(verse: ScriptureVerse): string {
  return `${getBook(verse.bookId)?.name ?? verse.bookId} ${verse.chapter}:${verse.verse}`;
}
