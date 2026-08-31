import Link from "next/link";
import { AdSlot } from "@/components/ad/AdSlot";
import { PassageSearchForm } from "@/components/search/PassageSearchForm";

export default function Home() {
  return (
    <section className="flex flex-1 flex-col px-6 py-16 md:py-24">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12">
        <div className="max-w-3xl">
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.24em] text-accent">
            Canonical scripture
          </p>
          <h1 className="mt-5 font-display text-5xl leading-tight text-text-primary md:text-7xl">
            Find the passage. Read every verse.
          </h1>
          <p className="mt-6 max-w-2xl font-sans text-lg leading-8 text-text-muted">
            Search or browse the World English Bible. Its canonical text is
            ready for reusable verse narration in the next build phases.
          </p>
        </div>
        <div className="max-w-4xl">
          <PassageSearchForm />
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link
              href="/browse"
              className="font-sans text-sm font-semibold text-accent transition-colors hover:text-accent-light"
            >
              Browse by book
            </Link>
            <span className="font-sans text-sm text-text-muted">
              Try John 3:16, Psalms 23, or Romans 8:28.
            </span>
          </div>
          <div className="mt-8">
            <AdSlot slotId="homepage-hero" />
          </div>
        </div>
      </div>
    </section>
  );
}
