import { type Metadata } from "next";

import { TopicCatalogueUnavailable } from "@/app/topics/(components)/TopicCatalogueUnavailable";
import { TopicDirectory } from "@/app/topics/(components)/TopicDirectory";
import { listPublishedTopics } from "@/lib/topics/catalogue";
import { type TopicSummary } from "@/lib/topics/types";

export const metadata: Metadata = {
  title: "Topical Scriptures · OneScripture",
  description:
    "Choose a carefully curated scripture collection for peace, rest, hope, healing, faith, and more.",
};

export default async function TopicsPage() {
  let topics: TopicSummary[] = [];
  let isUnavailable = false;

  try {
    topics = await listPublishedTopics();
  } catch {
    isUnavailable = true;
  }

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 md:py-24">
      <header className="grid gap-10 pb-16 md:grid-cols-[1fr_20rem] md:items-end">
        <div>
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.24em] text-accent">
            Listen by need
          </p>
          <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.98] text-text-primary md:text-7xl">
            Scripture for the moment you are in.
          </h1>
        </div>
        <p className="font-sans text-lg leading-8 text-text-muted">
          Each collection is reviewed, ordered, and built for focused listening—one passage or the whole sequence.
        </p>
      </header>

      {isUnavailable ? (
        <TopicCatalogueUnavailable />
      ) : (
        <TopicDirectory topics={topics} />
      )}
    </section>
  );
}
