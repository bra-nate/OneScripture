import Link from "next/link";

export function Nav() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <Link href="/" className="font-display text-xl text-text-primary">
        OneScripture
      </Link>
      <nav className="flex items-center gap-6 font-sans text-sm uppercase tracking-wide text-text-muted">
        <Link href="/browse" className="transition-colors hover:text-accent">
          Browse
        </Link>
        <Link href="/login" className="transition-colors hover:text-accent">
          Sign In
        </Link>
        <Link
          href="/signup"
          className="text-accent transition-colors hover:text-accent-light"
        >
          Sign Up
        </Link>
      </nav>
    </header>
  );
}
