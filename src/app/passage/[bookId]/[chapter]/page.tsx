import Link from "next/link";
import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { ChapterReader } from "@/app/passage/[bookId]/[chapter]/(components)/ChapterReader";
import { parsePassageQueryNumber } from "@/app/passage/[bookId]/[chapter]/(utils)/parsePassageQueryNumber";
import { AdSlot } from "@/components/ad/AdSlot";
import { RetryCurrentPageButton } from "@/components/RetryCurrentPageButton";
import { Button, Select, Status } from "@/components/ui";
import { APP_CONFIG } from "@/config/app";
import { formatDisplayRef, getBook, serializePassageRef, type PassageRef } from "@/lib/bible/reference";
import { getTranslation, TRANSLATIONS } from "@/lib/bible/translations";
import { type SelectionTranslationId } from "@/lib/audio/selection-contract";
import { getOwnedPlaylistSummaries } from "@/lib/playlists/catalogue";
import { getPlaylistErrorPresentation } from "@/lib/playlists/errors";
import { type PlaylistSummary } from "@/lib/playlists/types";
import { getCanonicalPassage } from "@/lib/scripture/catalogue";
import {
  getScriptureErrorPresentation,
  ScriptureError,
  type ScriptureErrorPresentation,
} from "@/lib/scripture/errors";
import { type CanonicalPassage } from "@/lib/scripture/types";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/passage/[bookId]/[chapter]">): Promise<Metadata> {
  const { bookId, chapter: chapterParam } = await params;
  const query = await searchParams;
  const book = getBook(bookId);
  const chapter = Number(chapterParam);
  const translation = getTranslation(
    typeof query.translation === "string" ? query.translation : null,
  );
  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    return {};
  }

  const displayReference = formatDisplayRef(
    {
      bookId: book.id,
      chapter,
      verseStart: parsePassageQueryNumber(query.verseStart),
      verseEnd: parsePassageQueryNumber(query.verseEnd),
    },
    translation.id,
  );

  return {
    title: displayReference,
    description: `Read and listen to ${displayReference} from the ${translation.label}.`,
    openGraph: {
      title: `${displayReference} · ${APP_CONFIG.NAME}`,
      description: `Read and listen to ${displayReference} from the ${translation.label}.`,
    },
  };
}

export default async function PassagePage({
  params,
  searchParams,
}: PageProps<"/passage/[bookId]/[chapter]">) {
  const { bookId, chapter: chapterParam } = await params;
  const query = await searchParams;
  const book = getBook(bookId);
  const chapter = Number(chapterParam);
  const translation = getTranslation(
    typeof query.translation === "string" ? query.translation : null,
  );

  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    notFound();
  }

  const reference: PassageRef = {
    bookId: book.id,
    chapter,
    verseStart: parsePassageQueryNumber(query.verseStart),
    verseEnd: parsePassageQueryNumber(query.verseEnd),
  };
  const displayReference = formatDisplayRef(reference, translation.id);
  let passage: CanonicalPassage | null = null;
  let catalogueError: ScriptureErrorPresentation | null = null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let playlists: PlaylistSummary[] = [];
  let playlistErrorMessage: string | null = null;
  if (user) {
    try {
      playlists = await getOwnedPlaylistSummaries();
    } catch (error) {
      playlistErrorMessage = getPlaylistErrorPresentation(error).message;
    }
  }

  try {
    passage = await getCanonicalPassage(reference, translation.id);
  } catch (error) {
    if (
      error instanceof ScriptureError &&
      (error.code === "invalid_reference" || error.code === "passage_not_found")
    ) {
      notFound();
    }
    catalogueError = getScriptureErrorPresentation(error);
  }

  return (
    <section
      className={
        APP_CONFIG.ADS_ENABLED
          ? "mx-auto grid w-full max-w-6xl flex-1 gap-8 px-6 py-12 lg:grid-cols-[1fr_18rem]"
          : "mx-auto grid w-full max-w-3xl flex-1 gap-8 px-6 py-12"
      }
    >
      <div>
        <Link
          href={`/browse/${book.id}?translation=${translation.id}`}
          className="editorial-link font-sans text-sm font-medium text-text-primary underline"
        >
          Back to {book.name}
        </Link>

        <header className="mt-6">
          <p className="editorial-kicker">
            {translation.label}
          </p>
          <h1 className="page-heading mt-5 text-text-primary">
            {displayReference}
          </h1>
          <p className="mt-4 max-w-2xl font-sans leading-7 text-text-muted">
            Public-domain text from eBible.org, preserved verse by verse for
            reusable narration and ordered playback.
          </p>
          <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
            <div>
              <label className="mb-2 block font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted" htmlFor="translation">
                Translation
              </label>
              <Select
                controlSize="small"
                defaultValue={translation.id}
                id="translation"
                name="translation"
              >
                {TRANSLATIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.id}: {option.label}
                  </option>
                ))}
              </Select>
            </div>
            {reference.verseStart !== null && (
              <input name="verseStart" type="hidden" value={reference.verseStart} />
            )}
            {reference.verseEnd !== null && (
              <input name="verseEnd" type="hidden" value={reference.verseEnd} />
            )}
            <Button size="small" type="submit" variant="selected">
              Change
            </Button>
          </form>
        </header>

        {catalogueError ? (
          <div className="mt-8">
            <Status label={catalogueError.label} tone="information">
              <p>{catalogueError.message}</p>
              <RetryCurrentPageButton />
            </Status>
          </div>
        ) : (
          passage && (
            <ChapterReader
              chapterReference={serializePassageRef(reference)}
              displayReference={displayReference}
              isSignedIn={Boolean(user)}
              playlistErrorMessage={playlistErrorMessage}
              playlists={playlists}
              translationCode={translation.id as SelectionTranslationId}
              verses={passage.verses}
            />
          )
        )}
      </div>

      {APP_CONFIG.ADS_ENABLED && (
        <aside>
          <AdSlot slotId="player-sidebar" />
        </aside>
      )}
    </section>
  );
}
