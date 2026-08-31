import { APP_CONFIG } from "@/config/app";

export function PassageSearchForm({
  defaultQuery = "",
  compact = false,
}: {
  defaultQuery?: string;
  compact?: boolean;
}) {
  return (
    <form
      action="/search"
      className={
        compact
          ? "grid gap-3 sm:grid-cols-[1fr_auto]"
          : "grid w-full max-w-3xl gap-3 sm:grid-cols-[1fr_auto]"
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
      <input
        name="translation"
        type="hidden"
        value={APP_CONFIG.DEFAULT_TRANSLATION}
      />
      <button
        type="submit"
        className="min-h-12 rounded-md bg-accent px-6 font-sans text-sm font-semibold uppercase tracking-wide text-background transition-colors hover:bg-accent-light"
      >
        Search
      </button>
    </form>
  );
}
