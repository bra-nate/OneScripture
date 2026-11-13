import { Button, Field, Select } from "@/components/ui";
import { routes } from "@/config/routes";
import { getTranslation, TRANSLATIONS } from "@/lib/bible/translations";

export interface PassageSearchFormProps {
  compact?: boolean;
  defaultQuery?: string;
  defaultTranslation?: string;
}

export function PassageSearchForm({
  defaultQuery = "",
  defaultTranslation,
  compact = false,
}: PassageSearchFormProps) {
  const translation = getTranslation(defaultTranslation);
  return (
    <form
      action={routes.search}
      className={
        compact
          ? "grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"
          : "grid min-w-0 w-full max-w-4xl gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"
      }
    >
      <Field isLabelHidden label="Go to a passage reference" name="q">
        <Field.Input
          defaultValue={defaultQuery}
          name="q"
          placeholder="Book chapter:verse, e.g. John 3:16"
          type="search"
        />
      </Field>
      <label className="sr-only" htmlFor="passage-translation">
        Bible translation
      </label>
      <Select
        defaultValue={translation.id}
        id="passage-translation"
        name="translation"
      >
        {TRANSLATIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.id}: {option.label}
          </option>
        ))}
      </Select>
      <Button size="large" type="submit">
        Go
      </Button>
    </form>
  );
}
