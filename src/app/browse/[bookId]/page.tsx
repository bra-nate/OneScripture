import Link from "next/link";
import { notFound } from "next/navigation";
import { getBook } from "@/lib/bible/reference";
import { getTranslation } from "@/lib/bible/translations";

export default async function BrowseBookPage({
  params,
  searchParams,
}: PageProps<"/browse/[bookId]">) {
  const { bookId } = await params;
  const query = await searchParams;
  const book = getBook(bookId);
  const translation = getTranslation(
    typeof query.translation === "string" ? query.translation : undefined,
  );

  if (!book) notFound();

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
      <Link
        href="/browse"
        className="editorial-link font-sans text-sm font-medium text-text-primary underline"
      >
        Back to books
      </Link>
      <div className="mt-10">
        <p className="editorial-kicker">Choose a chapter</p>
        <h1 className="page-heading mt-5 text-text-primary">{book.name}</h1>
        <p className="mt-3 font-sans text-text-muted">
          Select a chapter to read in the {translation.label}.
        </p>
      </div>
      <div className="mt-10 grid grid-cols-4 gap-3 rounded-surface bg-surface p-5 sm:grid-cols-6 md:grid-cols-8 md:p-8">
        {Array.from({ length: book.chapters }, (_, index) => index + 1).map(
          (chapter) => (
            <Link
              key={chapter}
              href={`/passage/${book.id}/${chapter}?translation=${translation.id}`}
              className="grid aspect-square place-items-center rounded-full border border-border bg-background font-sans text-sm font-medium text-text-primary transition-colors hover:border-text-primary hover:bg-accent"
            >
              {chapter}
            </Link>
          ),
        )}
      </div>
    </section>
  );
}
