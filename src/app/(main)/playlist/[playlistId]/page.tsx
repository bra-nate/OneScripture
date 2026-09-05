import { notFound } from "next/navigation";

import { removePlaylistItem } from "@/app/(main)/playlist/actions";
import { ScriptureAudioPlayer } from "@/components/player";
import { Button, ButtonLink, Surface } from "@/components/ui";
import { routes } from "@/config/routes";
import { serializePassageRef } from "@/lib/bible/reference";
import { getOwnedPlaylistDetail } from "@/lib/playlists/catalogue";

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ playlistId: string }>;
}) {
  const { playlistId } = await params;
  const playlist = await getOwnedPlaylistDetail(playlistId);
  if (!playlist) notFound();

  const references = playlist.items.map(({ reference }) => serializePassageRef(reference));

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <ButtonLink href={routes.playlists.index} size="small" variant="ghost">
        Back to playlists
      </ButtonLink>
      <header className="mt-6 max-w-2xl">
        <p className="font-sans text-sm uppercase tracking-eyebrow text-accent">
          Saved playlist
        </p>
        <h1 className="mt-3 font-display text-5xl text-text-primary">{playlist.name}</h1>
        <p className="mt-4 font-sans leading-7 text-text-muted">
          {references.length} {references.length === 1 ? "scripture" : "scriptures"}, played in order.
        </p>
      </header>

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
            const removeItem = removePlaylistItem.bind(null, playlist.id, item.id);
            return (
              <li key={item.id}>
                <Surface className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <ButtonLink href={routes.passage(item.reference)} variant="ghost">
                    {item.displayReference}
                  </ButtonLink>
                  <form action={removeItem}>
                    <Button size="small" type="submit" variant="ghost">
                      Remove
                    </Button>
                  </form>
                </Surface>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
