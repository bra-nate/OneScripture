import Link from "next/link";
import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { ChapterReader } from "@/app/passage/[bookId]/[chapter]/(components)/ChapterReader";
import { parsePassageQueryNumber } from "@/app/passage/[bookId]/[chapter]/(utils)/parsePassageQueryNumber";
import { AdSlot } from "@/components/ad/AdSlot";
import { RetryCurrentPageButton } from "@/components/RetryCurrentPageButton";
import { Status } from "@/components/ui";
import { APP_CONFIG } from "@/config/app";
import { formatDisplayRef, getBook, serializePassageRef, type PassageRef } from "@/lib/bible/reference";
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
    "WEB",
  );

  return {
    title: displayReference,
    description: `Read and listen to ${displayReference} from the World English Bible.`,
    openGraph: {
      title: `${displayReference} · ${APP_CONFIG.NAME}`,
      description: `Read and listen to ${displayReference} from the World English Bible.`,
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
    passage = await getCanonicalPassage(reference);
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
          href={`/browse/${book.id}`}
          className="editorial-link font-sans text-sm font-medium text-text-primary underline"
        >
          Back to {book.name}
        </Link>

        <header className="mt-6">
          <p className="editorial-kicker">
            World English Bible
          </p>
          <h1 className="page-heading mt-5 text-text-primary">
            {displayReference}
          </h1>
          <p className="mt-4 max-w-2xl font-sans leading-7 text-text-muted">
            Canonical public-domain text from eBible.org, preserved verse by
            verse for reusable narration and ordered playback.
          </p>
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
