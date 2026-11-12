import Link from "next/link";
import { BIBLE_BOOKS } from "@/lib/bible/reference";

export default function BrowsePage() {
  const groups = [
    { title: "Old Testament", books: BIBLE_BOOKS.filter((b) => b.testament === "OT") },
    { title: "New Testament", books: BIBLE_BOOKS.filter((b) => b.testament === "NT") },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
      <div className="max-w-2xl">
        <p className="editorial-kicker">The library</p>
        <h1 className="page-heading mt-5 text-text-primary">
          Browse by book.
        </h1>
        <p className="mt-3 font-sans text-text-muted">
          Choose a book and chapter to read the canonical scripture text.
        </p>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {groups.map((group) => (
          <section className="rounded-surface bg-surface p-6 md:p-8" key={group.title}>
            <h2 className="font-sans text-sm font-medium uppercase tracking-eyebrow text-text-primary">
              {group.title}
            </h2>
            <div className="mt-5 grid sm:grid-cols-2 sm:gap-x-8">
              {group.books.map((book) => (
                <Link
                  key={book.id}
                  href={`/browse/${book.id}`}
                  className="group flex min-h-16 items-center justify-between gap-4 border-b border-border py-4 transition-colors hover:text-accent-light"
                >
                  <span className="block font-sans text-base font-medium text-text-primary">
                    {book.name}
                  </span>
                  <span className="flex items-center gap-2 font-sans text-xs text-text-muted">
                    {book.chapters}
                    <span aria-hidden="true" className="size-2 rounded-full bg-[var(--page-decoration)]" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
