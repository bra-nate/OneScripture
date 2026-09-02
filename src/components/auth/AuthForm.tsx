"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { signIn, signUp } from "@/app/(auth)/actions";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Button, Field, Status } from "@/components/ui";
import { routes } from "@/config/routes";

export interface AuthFormProps {
  mode: "signup" | "login";
  initialError?: string;
}

export function AuthForm({
  mode,
  initialError,
}: AuthFormProps) {
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [pending, start] = useTransition();

  if (checkEmail) {
    return (
      <Status label="Check your inbox" tone="information">
        Confirm your email, then{" "}
        <Link href={routes.login} className="font-semibold underline">
          log in
        </Link>
        .
      </Status>
    );
  }

  function onSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      const result =
        mode === "signup" ? await signUp(formData) : await signIn(formData);
      if (result?.error) setError(result.error);
      else if (result && "checkEmail" in result && result.checkEmail)
        setCheckEmail(true);
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <Field isLabelHidden label="Email" name="email">
        <Field.Input
          autoComplete="email"
          name="email"
          placeholder="Email"
          required
          type="email"
        />
      </Field>
      <Field isLabelHidden label="Password" name="password">
        <Field.Input
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          name="password"
          placeholder="Password"
          required
          type="password"
        />
      </Field>
      {error && (
        <Status aria-live="polite" label="Unable to continue" tone="danger">
          {error}
        </Status>
      )}
      <Button isPending={pending} type="submit">
        {mode === "signup" ? "Create Account" : "Sign In"}
      </Button>
      <OAuthButtons />
      <p className="text-center font-sans text-sm text-text-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href={routes.login} className="text-accent hover:text-accent-light">
              Sign in →
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link href={routes.signup} className="text-accent hover:text-accent-light">
              Sign up →
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
