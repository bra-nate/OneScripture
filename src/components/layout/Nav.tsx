import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui";
import { APP_CONFIG } from "@/config/app";
import { routes } from "@/config/routes";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="app-chrome relative z-20 mx-3 mt-3 flex flex-col gap-4 rounded-[2rem] bg-surface px-5 py-4 sm:mx-6 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:rounded-control lg:mx-auto lg:w-[calc(100%-3rem)] lg:max-w-6xl">
      <Link
        href={routes.home}
        className="text-link-target w-fit font-display text-xl font-medium tracking-[-0.04em] text-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
      >
        {APP_CONFIG.NAME}
      </Link>
      <nav className="flex w-full min-w-0 flex-wrap items-center gap-x-5 gap-y-2 font-sans text-sm font-medium text-text-muted sm:w-auto sm:gap-6">
        <Link href={routes.browse} className="text-link-target transition-colors hover:text-accent">
          Browse
        </Link>
        <Link
          href={routes.topics.index}
          className="text-link-target transition-colors hover:text-accent"
        >
          Topics
        </Link>
        {user ? (
          <>
            <Link
              href={routes.playlists.index}
              className="text-link-target transition-colors hover:text-accent"
            >
              Playlists
            </Link>
            <form action={signOut}>
              <Button className="-mx-3 uppercase tracking-wide" size="small" type="submit" variant="ghost">
                Sign Out
              </Button>
            </form>
          </>
        ) : (
          <>
            <Link href={routes.login} className="text-link-target transition-colors hover:text-accent">
              Sign In
            </Link>
            <Link
              href={routes.signup}
              className="inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-text-primary transition-colors hover:bg-accent-light"
            >
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
