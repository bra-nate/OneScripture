import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui";
import { routes } from "@/config/routes";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="app-chrome flex flex-col gap-4 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href={routes.home}
        className="w-fit font-display text-xl text-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
      >
        OneScripture
      </Link>
      <nav className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 font-sans text-xs uppercase tracking-wide text-text-muted sm:w-auto sm:justify-start sm:gap-6 sm:text-sm">
        <Link href={routes.browse} className="transition-colors hover:text-accent">
          Browse
        </Link>
        <Link
          href={routes.topics.index}
          className="transition-colors hover:text-accent"
        >
          Topics
        </Link>
        {user ? (
          <>
            <Link
              href={routes.dashboard}
              className="transition-colors hover:text-accent"
            >
              Dashboard
            </Link>
            <Link
              href={routes.settings}
              className="transition-colors hover:text-accent"
            >
              Settings
            </Link>
            <form action={signOut}>
              <Button className="min-h-0 p-0 uppercase tracking-wide" size="small" type="submit" variant="ghost">
                Sign Out
              </Button>
            </form>
          </>
        ) : (
          <>
            <Link href={routes.login} className="transition-colors hover:text-accent">
              Sign In
            </Link>
            <Link
              href={routes.signup}
              className="text-accent transition-colors hover:text-accent-light"
            >
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
