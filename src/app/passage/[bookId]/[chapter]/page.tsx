import Link from "next/link";
import { notFound } from "next/navigation";

import { VerseList } from "@/app/passage/[bookId]/[chapter]/(components)/VerseList";
import { parsePassageQueryNumber } from "@/app/passage/[bookId]/[chapter]/(utils)/parsePassageQueryNumber";
import { AdSlot } from "@/components/ad/AdSlot";
import { ScriptureAudioPlayer } from "@/components/player";
import { Status } from "@/components/ui";
import { formatDisplayRef, getBook, serializePassageRef, type PassageRef } from "@/lib/bible/reference";
import { getCanonicalPassage } from "@/lib/scripture/catalogue";
import { ScriptureError } from "@/lib/scripture/errors";
import { type CanonicalPassage } from "@/lib/scripture/types";

export default async function PassagePage({
  params,
  searchParams,
}: PageProps<"/passage/[bookId]/[chapter]">) {
  const { bookId, chapter: chapterParam } = await params;
  const query = await searchParams;
  const book = getBook(bookId);
  const chapter = Number(chapterParam);

  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    notFound();
  }

  const reference: PassageRef = {
    bookId: book.id,
    chapter,
    verseStart: parsePassageQueryNumber(query.verseStart),
    verseEnd: parsePassageQueryNumber(query.verseEnd),
  };
  const displayReference = formatDisplayRef(reference, "WEB");
  let passage: CanonicalPassage | null = null;
  let catalogueError: string | null = null;

  try {
    passage = await getCanonicalPassage(reference);
  } catch (error) {
    if (
      error instanceof ScriptureError &&
      (error.code === "invalid_reference" || error.code === "passage_not_found")
    ) {
      notFound();
    }
    catalogueError =
      "The canonical scripture catalogue is still being prepared. Please try again shortly.";
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-6 py-12 lg:grid-cols-[1fr_18rem]">
      <div>
        <Link
          href={`/browse/${book.id}`}
          className="font-sans text-sm font-semibold text-accent transition-colors hover:text-accent-light"
        >
          Back to {book.name}
        </Link>

        <header className="mt-6">
          <p className="font-sans text-sm uppercase tracking-[0.2em] text-accent">
            World English Bible
          </p>
          <h1 className="mt-3 font-display text-5xl text-text-primary">
            {displayReference}
          </h1>
          <p className="mt-4 max-w-2xl font-sans leading-7 text-text-muted">
            Canonical public-domain text from eBible.org, preserved verse by
            verse for reusable narration and ordered playback.
          </p>
        </header>

        <div className="mt-8">
          {catalogueError ? (
            <Status label="Scripture text unavailable" tone="information">
              {catalogueError}
            </Status>
          ) : (
            passage && <VerseList verses={passage.verses} />
          )}
        </div>

        <div className="mt-8">
          <ScriptureAudioPlayer
            references={passage ? [serializePassageRef(reference)] : []}
            title={displayReference}
          />
        </div>
      </div>

      <aside>
        <AdSlot slotId="player-sidebar" />
      </aside>
    </section>
  );
}
