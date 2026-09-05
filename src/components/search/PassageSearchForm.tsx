import { APP_CONFIG } from "@/config/app";
import { Button, Field } from "@/components/ui";
import { routes } from "@/config/routes";

export interface PassageSearchFormProps {
  compact?: boolean;
  defaultQuery?: string;
}

export function PassageSearchForm({
  defaultQuery = "",
  compact = false,
}: PassageSearchFormProps) {
  return (
    <form
      action={routes.search}
      className={
        compact
          ? "grid gap-3 sm:grid-cols-[1fr_auto]"
          : "grid w-full max-w-3xl gap-3 sm:grid-cols-[1fr_auto]"
      }
    >
      <Field isLabelHidden label="Go to a passage reference" name="q">
        <Field.Input
          defaultValue={defaultQuery}
          name="q"
          placeholder="Book chapter:verse — e.g. John 3:16"
          type="search"
        />
      </Field>
      <input
        name="translation"
        type="hidden"
        value={APP_CONFIG.DEFAULT_TRANSLATION}
      />
      <Button size="large" type="submit">
        Go
      </Button>
    </form>
  );
}
