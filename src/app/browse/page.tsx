import Link from "next/link";
import { BIBLE_BOOKS } from "@/lib/bible/reference";

export default function BrowsePage() {
  const groups = [
    { title: "Old Testament", books: BIBLE_BOOKS.filter((b) => b.testament === "OT") },
    { title: "New Testament", books: BIBLE_BOOKS.filter((b) => b.testament === "NT") },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl text-text-primary">
          Browse by book
        </h1>
        <p className="mt-3 font-sans text-text-muted">
          Choose a book and chapter to open the audio player.
        </p>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              {group.title}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {group.books.map((book) => (
                <Link
                  key={book.id}
                  href={`/browse/${book.id}`}
                  className="rounded-md border border-border bg-surface p-4 transition-colors hover:border-accent"
                >
                  <span className="block font-sans text-base font-semibold text-text-primary">
                    {book.name}
                  </span>
                  <span className="mt-1 block font-sans text-xs text-text-muted">
                    {book.chapters} chapter{book.chapters === 1 ? "" : "s"}
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
