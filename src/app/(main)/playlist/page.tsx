import { PlaylistCreateForm } from "@/app/(main)/playlist/(components)/PlaylistCreateForm";
import { ButtonLink, Surface } from "@/components/ui";
import { routes } from "@/config/routes";
import { getOwnedPlaylistSummaries } from "@/lib/playlists/catalogue";

export default async function PlaylistPage() {
  const playlists = await getOwnedPlaylistSummaries();

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <header className="max-w-2xl">
        <p className="font-sans text-sm uppercase tracking-[0.2em] text-accent">
          Your listening library
        </p>
        <h1 className="mt-3 font-display text-5xl text-text-primary">Playlists</h1>
        <p className="mt-4 font-sans leading-7 text-text-muted">
          Create a collection, then add individual verses from any book or chapter.
        </p>
      </header>

      <Surface className="mt-8 p-5 md:p-7" variant="strong">
        <h2 className="font-display text-2xl text-text-primary">Create a playlist</h2>
        <div className="mt-5">
          <PlaylistCreateForm />
        </div>
      </Surface>

      <div className="mt-10">
        <h2 className="font-display text-3xl text-text-primary">Saved playlists</h2>
        {playlists.length === 0 ? (
          <Surface className="mt-5 p-6">
            <p className="font-sans text-text-muted">
              No playlists yet. Create one above, then browse Scripture to add verses.
            </p>
          </Surface>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {playlists.map((playlist) => (
              <li key={playlist.id}>
                <Surface className="flex h-full items-center justify-between gap-4 p-5">
                  <div>
                    <h3 className="font-display text-2xl text-text-primary">{playlist.name}</h3>
                    <p className="mt-1 font-sans text-sm text-text-muted">
                      {playlist.itemCount} {playlist.itemCount === 1 ? "scripture" : "scriptures"}
                    </p>
                  </div>
                  <ButtonLink href={routes.playlists.detail(playlist.id)} size="small">
                    Open
                  </ButtonLink>
                </Surface>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
