import Link from "next/link";

import { routes } from "@/config/routes";
import { type TopicSummary } from "@/lib/topics/types";

export interface TopicDirectoryItemProps {
  index: number;
  topic: TopicSummary;
}

export function TopicDirectoryItem({ index, topic }: TopicDirectoryItemProps) {
  return (
    <li className="group border-b border-border">
      <Link
        href={routes.topics.detail(topic.slug)}
        className="grid min-h-44 gap-6 py-8 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:grid-cols-[5rem_1fr_auto] md:items-center md:px-6"
      >
        <span className="font-display text-4xl text-accent" aria-hidden="true">
          {String(index).padStart(2, "0")}
        </span>
        <span>
          <span className="flex flex-wrap items-baseline gap-3">
            <span className="font-display text-3xl text-text-primary md:text-4xl">
              {topic.title}
            </span>
            {topic.isFeatured && (
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Featured
              </span>
            )}
          </span>
          <span className="mt-3 block max-w-2xl font-sans leading-7 text-text-muted">
            {topic.description}
          </span>
        </span>
        <span className="font-sans text-sm font-semibold text-text-primary">
          {topic.passageCount} {topic.passageCount === 1 ? "passage" : "passages"}
          <span aria-hidden="true" className="ml-3 text-accent">
            →
          </span>
        </span>
      </Link>
    </li>
  );
}
