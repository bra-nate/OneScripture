import { ButtonLink, Surface } from "@/components/ui";
import { routes } from "@/config/routes";

export default function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 items-center px-6 py-16">
      <Surface className="w-full p-8 md:p-12">
        <p className="font-sans text-sm uppercase tracking-eyebrow text-accent">
          Not found
        </p>
        <h1 className="mt-3 font-display text-4xl text-text-primary md:text-5xl">
          That passage isn&apos;t here
        </h1>
        <p className="mt-4 max-w-xl font-sans leading-7 text-text-muted">
          The reference may be misspelled, or the chapter may not exist in that
          book. Search for a reference or browse the World English Bible.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={routes.home}>Search a passage</ButtonLink>
          <ButtonLink href={routes.browse} variant="secondary">
            Browse by book
          </ButtonLink>
        </div>
      </Surface>
    </section>
  );
}
