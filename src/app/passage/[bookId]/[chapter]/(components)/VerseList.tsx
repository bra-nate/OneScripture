import { type ScriptureVerse } from "@/lib/scripture/types";

export interface VerseListProps {
  verses: ScriptureVerse[];
}

export function VerseList({ verses }: VerseListProps) {
  return (
    <ol className="space-y-5" aria-label="Scripture verses">
      {verses.map((verse) => (
        <li
          id={`verse-${verse.verse}`}
          key={verse.id}
          className="grid grid-cols-[2rem_1fr] gap-3"
        >
          <span
            aria-hidden="true"
            className="pt-1 font-sans text-xs font-semibold text-accent"
          >
            {verse.verse}
          </span>
          <p className="font-serif text-lg leading-8 text-text-primary">
            {verse.text || (
              <span className="italic text-text-muted">
                Text not present in this edition.
              </span>
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}
