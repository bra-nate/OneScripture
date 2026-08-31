import { APP_CONFIG } from "@/config/app";
import { translationSelectOptions } from "@/lib/bible/translations";

export function PassageSearchForm({
  defaultQuery = "",
  defaultTranslation = APP_CONFIG.DEFAULT_TRANSLATION,
  compact = false,
}: {
  defaultQuery?: string;
  defaultTranslation?: string;
  compact?: boolean;
}) {
  const options = translationSelectOptions();

  return (
    <form
      action="/search"
      className={
        compact
          ? "grid gap-3 sm:grid-cols-[1fr_9rem_auto]"
          : "grid w-full max-w-3xl gap-3 sm:grid-cols-[1fr_10rem_auto]"
      }
    >
      <label className="sr-only" htmlFor="q">
        Passage
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={defaultQuery}
        placeholder="John 3:16 or Psalms 23"
        className="min-h-12 rounded-md border border-border bg-surface px-4 font-sans text-base text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent"
      />
      <label className="sr-only" htmlFor="translation">
        Translation
      </label>
      <select
        id="translation"
        name="translation"
        defaultValue={defaultTranslation}
        className="min-h-12 rounded-md border border-border bg-surface px-3 font-sans text-sm text-text-primary outline-none transition-colors focus:border-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="min-h-12 rounded-md bg-accent px-6 font-sans text-sm font-semibold uppercase tracking-wide text-background transition-colors hover:bg-accent-light"
      >
        Search
      </button>
    </form>
  );
}
