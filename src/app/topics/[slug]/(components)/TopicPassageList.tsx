import Link from "next/link";

import { routes } from "@/config/routes";
import { type TopicPassage } from "@/lib/topics/types";

export interface TopicPassageListProps {
  passages: TopicPassage[];
}

export function TopicPassageList({ passages }: TopicPassageListProps) {
  if (passages.length === 0) {
    return (
      <p className="border-y border-border py-10 font-sans text-text-muted">
        This collection is still being arranged.
      </p>
    );
  }

  return (
    <ol className="border-t border-border">
      {passages.map((passage) => (
        <li
          key={passage.id}
          className="grid min-h-28 grid-cols-[3rem_1fr] items-center gap-4 border-b border-border py-5 md:grid-cols-[5rem_1fr_auto] md:px-5"
        >
          <span className="font-display text-2xl text-accent" aria-hidden="true">
            {String(passage.position).padStart(2, "0")}
          </span>
          <div>
            <p className="font-display text-2xl text-text-primary md:text-3xl">
              {passage.displayReference}
            </p>
            <p className="mt-1 font-sans text-xs uppercase tracking-[0.16em] text-text-muted">
              World English Bible
            </p>
          </div>
          <Link
            href={routes.passage(passage.reference)}
            className="col-start-2 min-h-11 w-fit py-3 font-sans text-sm font-semibold text-accent transition-colors hover:text-accent-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:col-start-auto"
          >
            Read passage <span aria-hidden="true">→</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
