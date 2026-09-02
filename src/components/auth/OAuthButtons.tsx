"use client";

import { useState, useTransition } from "react";

import { signInWithOAuth } from "@/app/(auth)/actions";
import { Button, Status } from "@/components/ui";
import { type OAuthProvider } from "@/lib/auth/oauth";

type ProviderOption = {
  id: OAuthProvider;
  label: string;
  isEnabled: boolean;
};

const PROVIDERS: ProviderOption[] = [
  {
    id: "google",
    label: "Continue with Google",
    isEnabled: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true",
  },
  {
    id: "apple",
    label: "Continue with Apple",
    isEnabled: process.env.NEXT_PUBLIC_APPLE_AUTH_ENABLED === "true",
  },
];

export function OAuthButtons() {
  const [error, setError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSignIn(provider: OAuthProvider) {
    setError(null);
    setPendingProvider(provider);

    startTransition(async () => {
      const result = await signInWithOAuth(provider);
      if (result?.error) setError(result.error);
      setPendingProvider(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="font-sans text-xs uppercase tracking-wider text-text-muted">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {PROVIDERS.map(({ id, label, isEnabled }) => {
        const isCurrentProvider = pendingProvider === id;
        const buttonLabel = isCurrentProvider ? "Redirecting…" : label;

        return (
          <Button
            key={id}
            type="button"
            variant="secondary"
            disabled={!isEnabled || isPending}
            title={isEnabled ? undefined : `${label} setup pending`}
            onClick={() => handleSignIn(id)}
          >
            {buttonLabel}
            {!isEnabled && " — setup pending"}
          </Button>
        );
      })}

      {error && (
        <Status aria-live="polite" label="Provider sign-in failed" tone="danger">
          {error}
        </Status>
      )}
    </div>
  );
}
