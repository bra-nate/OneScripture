import { RetryCurrentPageButton } from "@/components/RetryCurrentPageButton";
import { Status } from "@/components/ui";
import { type ScriptureErrorPresentation } from "@/lib/scripture/errors";

export function TopicCatalogueUnavailable({
  label,
  message,
}: ScriptureErrorPresentation) {
  return (
    <Status className="border-x-0 py-8" label={label} tone="information">
      <p className="max-w-xl">{message}</p>
      <RetryCurrentPageButton />
    </Status>
  );
}
