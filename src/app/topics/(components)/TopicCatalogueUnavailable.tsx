import { Status } from "@/components/ui";

export function TopicCatalogueUnavailable() {
  return (
    <Status className="border-x-0 py-8" label="Topics are temporarily unavailable" tone="information">
      <p className="max-w-xl">
        The scripture catalogue could not be reached. Please try again shortly.
      </p>
    </Status>
  );
}
