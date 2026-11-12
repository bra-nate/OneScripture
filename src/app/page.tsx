import Link from "next/link";
import { AdSlot } from "@/components/ad/AdSlot";
import { PassageSearchForm } from "@/components/search/PassageSearchForm";
import { routes } from "@/config/routes";

export default function Home() {
  return (
    <section className="flex flex-1 flex-col px-4 py-14 sm:px-6 md:py-24">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 md:gap-16">
        <div className="relative z-10 max-w-5xl">
          <p className="editorial-kicker">
            Canonical scripture
          </p>
          <h1 className="display-heading mt-6 text-text-primary">
            Find it. Hear it. Keep it.
          </h1>
          <p className="mt-8 max-w-xl font-sans text-lg leading-8 text-text-muted md:text-xl">
            Read the World English Bible and hear any verse, range, or chapter
            narrated aloud — pick what you want, play it once or on repeat.
          </p>
        </div>
        <div className="relative z-10 rounded-surface bg-surface p-5 md:max-w-4xl md:p-7">
          <PassageSearchForm />
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href={routes.browse}
              className="editorial-link font-sans text-sm font-medium text-text-primary underline"
            >
              Browse by book
            </Link>
            <Link
              href={routes.topics.index}
              className="editorial-link font-sans text-sm font-medium text-text-primary underline"
            >
              Listen by need
            </Link>
            <span className="font-sans text-sm text-text-muted">
              Jump to a reference: John 3:16, Psalms 23, Romans 8:28.
            </span>
          </div>
          <AdSlot slotId="homepage-hero" />
        </div>
        <div className="hero-paper-art" aria-hidden="true">
          <div className="paper-wave">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}
