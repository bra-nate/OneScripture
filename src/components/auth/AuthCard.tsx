import Link from "next/link";

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
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <Link
          href="/"
          className="mb-6 block text-center font-display text-2xl text-accent"
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
      </div>
    </div>
  );
}
