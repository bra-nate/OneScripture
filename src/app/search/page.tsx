import Link from "next/link";

import { SearchEmptyState } from "@/app/search/(components)/SearchEmptyState";
import { PassageSearchForm } from "@/components/search/PassageSearchForm";
import { formatDisplayRef, parseReference } from "@/lib/bible/reference";
import { getTranslation } from "@/lib/bible/translations";

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const translation = getTranslation();
  const parsed = parseReference(query);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
      <div>
        <h1 className="font-display text-4xl text-text-primary">Search</h1>
        <div className="mt-6">
          <PassageSearchForm
            defaultQuery={query}
            compact
          />
        </div>
      </div>

      <div className="mt-10">
        {!query ? (
          <SearchEmptyState
            title="Start with a passage reference"
            body="Search by book and chapter, or include a verse range."
          />
        ) : parsed ? (
          <Link
            href={`/passage/${parsed.bookId}/${parsed.chapter}?translation=${translation.id}${
              parsed.verseStart ? `&verseStart=${parsed.verseStart}` : ""
            }${parsed.verseEnd ? `&verseEnd=${parsed.verseEnd}` : ""}`}
            className="block rounded-lg border border-border bg-surface p-6 transition-colors hover:border-accent"
          >
            <p className="font-sans text-sm uppercase tracking-[0.2em] text-accent">
              Best match
            </p>
            <h2 className="mt-3 font-display text-3xl text-text-primary">
              {formatDisplayRef(parsed, translation.id.replace(/^ENG/, ""))}
            </h2>
            <p className="mt-3 font-sans text-sm text-text-muted">
              Read the canonical passage from the World English Bible.
            </p>
          </Link>
        ) : (
          <SearchEmptyState
            title="No passage match"
            body="OneScripture currently supports direct passage references such as John 3:16, Psalms 23, or Romans 8:28."
          />
        )}
      </div>
    </section>
  );
}
