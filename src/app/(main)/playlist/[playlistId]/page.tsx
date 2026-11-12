import { notFound } from "next/navigation";

import { PlaylistItemRemoveForm } from "@/app/(main)/playlist/(components)/PlaylistItemRemoveForm";
import { RetryCurrentPageButton } from "@/components/RetryCurrentPageButton";
import { ScriptureAudioPlayer } from "@/components/player";
import { ButtonLink, Status, Surface } from "@/components/ui";
import { routes } from "@/config/routes";
import { serializePassageRef } from "@/lib/bible/reference";
import { getOwnedPlaylistDetail } from "@/lib/playlists/catalogue";
import { getPlaylistErrorPresentation, type PlaylistErrorPresentation } from "@/lib/playlists/errors";
import { type PlaylistDetail } from "@/lib/playlists/types";

export default async function PlaylistDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ playlistId: string }>;
  searchParams: Promise<{ updated?: string | string[] }>;
}) {
  const { playlistId } = await params;
  const query = await searchParams;
  let playlist: PlaylistDetail | null = null;
  let playlistError: PlaylistErrorPresentation | null = null;

  try {
    playlist = await getOwnedPlaylistDetail(playlistId);
  } catch (error) {
    playlistError = getPlaylistErrorPresentation(error);
  }

  if (playlistError) {
    return (
      <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 md:py-24">
        <ButtonLink href={routes.playlists.index} size="small" variant="ghost">
          Back to playlists
        </ButtonLink>
        <Status className="mt-8" label={playlistError.label} tone="information">
          <p>{playlistError.message}</p>
          <RetryCurrentPageButton />
        </Status>
      </section>
    );
  }

  if (!playlist) notFound();

  const references = playlist.items.map(({ reference }) => serializePassageRef(reference));

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 md:py-24">
      <ButtonLink href={routes.playlists.index} size="small" variant="ghost">
        Back to playlists
      </ButtonLink>
      <header className="mt-6 max-w-2xl">
        <p className="editorial-kicker">
          Saved playlist
        </p>
        <h1 className="page-heading mt-5 text-text-primary">{playlist.name}</h1>
        <p className="mt-4 font-sans leading-7 text-text-muted">
          {references.length} {references.length === 1 ? "scripture" : "scriptures"}, played in order.
        </p>
      </header>

      {query.updated === "removed" && (
        <Status className="mt-6" label="Playlist updated" tone="success">
          The scripture was removed from this playlist.
        </Status>
      )}

      <div className="mt-8">
        <ScriptureAudioPlayer references={references} title={playlist.name} />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-3xl text-text-primary">Scriptures</h2>
        <ButtonLink href={routes.browse} size="small" variant="secondary">
          Add from the Bible
        </ButtonLink>
      </div>

      {playlist.items.length === 0 ? (
        <Surface className="mt-5 p-6">
          <p className="font-sans text-text-muted">
            This playlist is empty. Browse to a chapter and add any verse.
          </p>
        </Surface>
      ) : (
        <ol className="mt-5 grid gap-3">
          {playlist.items.map((item) => {
            return (
              <li key={item.id}>
                <Surface className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <ButtonLink href={routes.passage(item.reference)} variant="ghost">
                    {item.displayReference}
                  </ButtonLink>
                  <PlaylistItemRemoveForm itemId={item.id} playlistId={playlist.id} />
                </Surface>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
