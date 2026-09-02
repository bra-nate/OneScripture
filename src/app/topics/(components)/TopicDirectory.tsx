import { TopicDirectoryItem } from "@/app/topics/(components)/TopicDirectoryItem";
import { type TopicSummary } from "@/lib/topics/types";

export interface TopicDirectoryProps {
  topics: TopicSummary[];
}

export function TopicDirectory({ topics }: TopicDirectoryProps) {
  if (topics.length === 0) {
    return (
      <div className="border-t border-border py-12">
        <p className="font-display text-3xl text-text-primary">
          The first collections are being reviewed.
        </p>
        <p className="mt-3 max-w-xl font-sans leading-7 text-text-muted">
          Carefully ordered topical scriptures will appear here as soon as
          editorial review is complete.
        </p>
      </div>
    );
  }

  return (
    <ol className="border-t border-border">
      {topics.map((topic, index) => (
        <TopicDirectoryItem
          key={topic.id}
          index={index + 1}
          topic={topic}
        />
      ))}
    </ol>
  );
}
