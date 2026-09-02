import Link from "next/link";

import { Surface } from "@/components/ui";
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
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Surface className="w-full max-w-sm p-8">
        <Link
          href={routes.home}
          className="mb-6 block text-center font-display text-2xl text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
        >
          OneScripture
        </Link>
        <h1 className="font-sans text-lg font-medium text-text-primary">
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
