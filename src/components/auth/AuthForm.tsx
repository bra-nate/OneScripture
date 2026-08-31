"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { signIn, signUp } from "@/app/(auth)/actions";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

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
      <p className="font-sans text-sm text-text-primary">
        Check your inbox to confirm your email, then{" "}
        <Link href="/login" className="text-accent hover:text-accent-light">
          log in
        </Link>
        .
      </p>
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

  const inputClass =
    "rounded-md border border-border bg-background px-3 py-2 font-sans text-sm text-text-primary outline-none focus:border-accent";

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <input
        aria-label="Email"
        name="email"
        type="email"
        placeholder="Email"
        autoComplete="email"
        required
        className={inputClass}
      />
      <input
        aria-label="Password"
        name="password"
        type="password"
        placeholder="Password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        required
        className={inputClass}
      />
      {error && (
        <p aria-live="polite" className="font-sans text-sm text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-4 py-2 font-sans text-sm font-medium text-background transition-colors hover:bg-accent-light disabled:opacity-60"
      >
        {mode === "signup" ? "Create Account" : "Sign In"}
      </button>
      <OAuthButtons />
      <p className="text-center font-sans text-sm text-text-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:text-accent-light">
              Sign in →
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-accent hover:text-accent-light">
              Sign up →
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
