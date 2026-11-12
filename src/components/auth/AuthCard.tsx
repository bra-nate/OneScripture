import Link from "next/link";

import { Wordmark } from "@/components/brand/Wordmark";
import { Surface } from "@/components/ui";
import { APP_CONFIG } from "@/config/app";
import { routes } from "@/config/routes";

export function AuthCard({
  heading,
  subtext,
  children,
}: {
  heading: string;
  subtext?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 md:py-24">
      <Surface className="w-full max-w-md p-8 md:p-10">
        <Link
          href={routes.home}
          className="text-link-target mb-10 w-fit focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
        >
          <Wordmark className="h-auto w-40" />
        </Link>
        <p className="editorial-kicker">{APP_CONFIG.NAME} account</p>
        <h1 className="mt-4 font-display text-4xl font-medium tracking-[-0.05em] text-text-primary">
          {heading}
        </h1>
        {subtext && (
          <p className="mt-1 font-sans text-sm text-text-muted">{subtext}</p>
        )}
        <div className="mt-6">{children}</div>
      </Surface>
    </div>
  );
}
