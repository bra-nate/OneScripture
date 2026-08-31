import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad/AdSlot";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { audioFilename, resolveChapterAudio } from "@/lib/bible/audio";
import { formatDisplayRef, getBook, type PassageRef } from "@/lib/bible/reference";
import { getTranslation, TRANSLATIONS } from "@/lib/bible/translations";

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

  const ref: PassageRef = {
    bookId: book.id,
    chapter,
    verseStart:
      typeof query.verseStart === "string" ? Number(query.verseStart) : null,
    verseEnd: typeof query.verseEnd === "string" ? Number(query.verseEnd) : null,
  };
  const translation = getTranslation(
    typeof query.translation === "string" ? query.translation : undefined,
  );

  let resolved:
    | Awaited<ReturnType<typeof resolveChapterAudio>>
    | { error: string };
  try {
    resolved = await resolveChapterAudio(ref, translation.id);
  } catch (error) {
    resolved = { error: (error as Error).message };
  }

  const displayRef =
    "error" in resolved
      ? formatDisplayRef(ref, translation.id.replace(/^ENG/, ""))
      : resolved.displayRef;
  const playerHref = `/passage/${book.id}/${chapter}`;

  return (
    <section className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-6 py-12 lg:grid-cols-[1fr_18rem]">
      <div>
        <Link
          href={`/browse/${book.id}`}
          className="font-sans text-sm font-semibold text-accent transition-colors hover:text-accent-light"
        >
          Back to {book.name}
        </Link>
        <div className="mt-6">
          <p className="font-sans text-sm uppercase tracking-[0.2em] text-accent">
            Now playing
          </p>
          <h1 className="mt-3 font-display text-5xl text-text-primary">
            {displayRef}
          </h1>
          <p className="mt-4 max-w-2xl font-sans leading-7 text-text-muted">
            Full chapter audio streams directly from Bible.is. Verse-specific
            downloads use the same chapter audio until verse-level slicing is
            added.
          </p>
        </div>

        <form action={playerHref} className="mt-8 flex max-w-xs flex-col gap-2">
          <label
            htmlFor="translation"
            className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-text-muted"
          >
            Translation
          </label>
          <select
            id="translation"
            name="translation"
            defaultValue={translation.id}
            className="min-h-11 rounded-md border border-border bg-surface px-3 font-sans text-sm text-text-primary outline-none focus:border-accent"
          >
            {TRANSLATIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.id.replace(/^ENG/, "")}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-border px-4 py-2 font-sans text-sm font-semibold text-accent transition-colors hover:border-accent"
          >
            Load audio
          </button>
        </form>

        <div className="mt-8">
          {"error" in resolved ? (
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="font-sans text-lg font-semibold text-text-primary">
                Audio unavailable
              </h2>
              <p className="mt-2 font-sans text-sm leading-6 text-text-muted">
                {resolved.error}
              </p>
            </div>
          ) : (
            <>
              <AudioPlayer src={resolved.audioUrl} />
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/download?audioUrl=${encodeURIComponent(
                    resolved.audioUrl,
                  )}&filename=${encodeURIComponent(
                    audioFilename(resolved.displayRef),
                  )}&displayRef=${encodeURIComponent(resolved.displayRef)}`}
                  className="rounded-md bg-accent px-5 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-background transition-colors hover:bg-accent-light"
                >
                  Download MP3
                </Link>
                <Link
                  href="/login"
                  className="rounded-md border border-border px-5 py-3 font-sans text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  Sign in to save
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <aside>
        <AdSlot slotId="player-sidebar" />
      </aside>
    </section>
  );
}
