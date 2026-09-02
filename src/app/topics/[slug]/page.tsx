import Link from "next/link";
import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { TopicPassageList } from "@/app/topics/[slug]/(components)/TopicPassageList";
import { TopicPlaybackPreview } from "@/app/topics/[slug]/(components)/TopicPlaybackPreview";
import { TopicCatalogueUnavailable } from "@/app/topics/(components)/TopicCatalogueUnavailable";
import { routes } from "@/config/routes";
import { getPublishedTopic } from "@/lib/topics/catalogue";
import { type ScriptureTopic } from "@/lib/topics/types";

interface TopicDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: TopicDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const topic = await getPublishedTopic(slug);
    if (!topic) return { title: "Topical Scriptures · OneScripture" };
    return {
      title: `${topic.title} · Topical Scriptures · OneScripture`,
      description: topic.description,
    };
  } catch {
    return { title: "Topical Scriptures · OneScripture" };
  }
}

export default async function TopicDetailPage({
  params,
}: TopicDetailPageProps) {
  const { slug } = await params;
  let topic: ScriptureTopic | null = null;
  let isUnavailable = false;

  try {
    topic = await getPublishedTopic(slug);
  } catch {
    isUnavailable = true;
  }

  if (!isUnavailable && !topic) notFound();

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 md:py-20">
      <Link
        href={routes.topics.index}
        className="font-sans text-sm font-semibold text-accent transition-colors hover:text-accent-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        ← All topics
      </Link>

      {isUnavailable || !topic ? (
        <div className="mt-12">
          <TopicCatalogueUnavailable />
        </div>
      ) : (
        <>
          <header className="grid gap-10 py-14 md:grid-cols-[1fr_23rem] md:items-end md:py-20">
            <div>
              <p className="font-sans text-sm font-semibold uppercase tracking-[0.24em] text-accent">
                Topical scriptures
              </p>
              <h1 className="mt-5 font-display text-6xl leading-[0.92] text-text-primary md:text-8xl">
                {topic.title}
              </h1>
            </div>
            <p className="font-sans text-lg leading-8 text-text-muted">
              {topic.description}
            </p>
          </header>

          <TopicPlaybackPreview passageCount={topic.passageCount} />

          <div className="mt-16">
            <div className="mb-6 flex items-end justify-between gap-5">
              <h2 className="font-display text-4xl text-text-primary">
                Listening order
              </h2>
              <p className="font-sans text-sm text-text-muted">
                {topic.translationCode}
              </p>
            </div>
            <TopicPassageList passages={topic.passages} />
          </div>
        </>
      )}
    </section>
  );
}
