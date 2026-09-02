import { type ReactNode } from "react";

import { Surface } from "@/components/ui";

export interface PlaceholderPageProps {
  description: ReactNode;
  title: string;
}

export function PlaceholderPage({ description, title }: PlaceholderPageProps) {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 items-start px-6 py-12 md:py-20">
      <Surface className="w-full max-w-3xl p-8 md:p-12">
        <h1 className="font-display text-4xl text-text-primary md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl font-sans text-base leading-7 text-text-muted md:text-lg">
          {description}
        </p>
      </Surface>
    </section>
  );
}
