import Link from "next/link";
import { AdSlot } from "@/components/ad/AdSlot";
import { PassageSearchForm } from "@/components/search/PassageSearchForm";
import { routes } from "@/config/routes";

export default function Home() {
  return (
    <section className="flex flex-1 flex-col px-6 py-16 md:py-24">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12">
        <div className="max-w-3xl">
          <p className="font-sans text-sm font-semibold uppercase tracking-hero text-accent">
            Canonical scripture
          </p>
          <h1 className="mt-5 font-display text-5xl leading-tight text-text-primary md:text-7xl">
            Find the passage. Read every verse.
          </h1>
          <p className="mt-6 max-w-2xl font-sans text-lg leading-8 text-text-muted">
            Read the World English Bible and hear any verse, range, or chapter
            narrated aloud — pick what you want, play it once or on repeat.
          </p>
        </div>
        <div className="max-w-4xl">
          <PassageSearchForm />
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link
              href={routes.browse}
              className="font-sans text-sm font-semibold text-accent transition-colors hover:text-accent-light"
            >
              Browse by book
            </Link>
            <Link
              href={routes.topics.index}
              className="font-sans text-sm font-semibold text-accent transition-colors hover:text-accent-light"
            >
              Explore topical scriptures
            </Link>
            <span className="font-sans text-sm text-text-muted">
              Jump to a reference: John 3:16, Psalms 23, Romans 8:28.
            </span>
          </div>
          <AdSlot slotId="homepage-hero" />
        </div>
      </div>
    </section>
  );
}
