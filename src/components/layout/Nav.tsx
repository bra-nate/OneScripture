import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <Link href="/" className="font-display text-xl text-text-primary">
        OneScripture
      </Link>
      <nav className="flex items-center gap-6 font-sans text-sm uppercase tracking-wide text-text-muted">
        <Link href="/browse" className="transition-colors hover:text-accent">
          Browse
        </Link>
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="transition-colors hover:text-accent"
            >
              Dashboard
            </Link>
            <Link
              href="/settings"
              className="transition-colors hover:text-accent"
            >
              Settings
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="uppercase tracking-wide transition-colors hover:text-accent"
              >
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="transition-colors hover:text-accent">
              Sign In
            </Link>
            <Link
              href="/signup"
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
