"use client";

import { useEffect } from "react";

import { Button, ButtonLink, Surface } from "@/components/ui";
import { routes } from "@/config/routes";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 items-center px-6 py-16">
      <Surface className="w-full p-8 md:p-12">
        <p className="font-sans text-sm uppercase tracking-eyebrow text-accent">
          Something broke
        </p>
        <h1 className="mt-3 font-display text-4xl text-text-primary md:text-5xl">
          This page didn&apos;t load
        </h1>
        <p className="mt-4 max-w-xl font-sans leading-7 text-text-muted">
          The scripture text and audio are unaffected. Try again, or start from
          a fresh passage.
        </p>
        {error.digest && (
          <p className="mt-3 font-sans text-xs text-text-muted">
            Reference code: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href={routes.home} variant="secondary">
            Back to search
          </ButtonLink>
        </div>
      </Surface>
    </section>
  );
}
