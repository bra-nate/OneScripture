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
  const translation = getTranslation(
    typeof params.translation === "string" ? params.translation : null,
  );
  const parsed = parseReference(query);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16 md:py-24">
      <div>
        <p className="editorial-kicker">Search</p>
        <h1 className="page-heading mt-5 text-text-primary">Go to a passage.</h1>
        <div className="mt-8 rounded-surface bg-surface p-5 md:p-7">
          <PassageSearchForm
            defaultQuery={query}
            defaultTranslation={translation.id}
            compact
          />
        </div>
      </div>

      <div className="mt-12">
        {!query ? (
          <SearchEmptyState
            title="Start with a passage reference"
            body="Enter a book and chapter, optionally with a verse or range: John 3, John 3:16, or John 3:16-18. Word search across the text is not available yet."
          />
        ) : parsed ? (
          <Link
            href={`/passage/${parsed.bookId}/${parsed.chapter}?translation=${translation.id}${
              parsed.verseStart ? `&verseStart=${parsed.verseStart}` : ""
            }${parsed.verseEnd ? `&verseEnd=${parsed.verseEnd}` : ""}`}
            className="group block rounded-surface bg-surface p-7 transition-transform motion-safe:hover:-translate-y-1 md:p-10"
          >
            <p className="editorial-kicker">
              Best match
            </p>
            <h2 className="mt-5 font-display text-4xl font-medium tracking-[-0.05em] text-text-primary md:text-5xl">
              {formatDisplayRef(parsed, translation.id.replace(/^ENG/, ""))}
            </h2>
            <p className="mt-3 font-sans text-sm text-text-muted">
              Read the canonical passage from the {translation.label}.
            </p>
          </Link>
        ) : (
          <SearchEmptyState
            title="That isn't a passage reference"
            body="This looks up references, not words. Try a book and chapter such as John 3:16, Psalms 23, or Romans 8:28, or browse by book."
          />
        )}
      </div>
    </section>
  );
}
