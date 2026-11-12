"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { requestPasswordReset } from "@/app/(auth)/actions";
import { Button, Field, Status } from "@/components/ui";
import { routes } from "@/config/routes";

export function PasswordResetRequestForm() {
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (checkEmail) {
    return (
      <Status label="Check your inbox" tone="information">
        If an account exists for that email, a password-reset link is on its way.
      </Status>
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(formData);
      if (result.error) setError(result.error);
      else setCheckEmail(true);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <Field isLabelHidden label="Email" name="email">
        <Field.Input
          autoComplete="email"
          name="email"
          placeholder="Email"
          required
          type="email"
        />
      </Field>
      {error && (
        <Status aria-live="polite" label="Unable to send reset email" tone="danger">
          {error}
        </Status>
      )}
      <Button isPending={isPending} type="submit">
        Send Reset Link
      </Button>
      <Link
        href={routes.login}
        className="text-link-target justify-center text-center font-sans text-sm font-semibold text-text-primary underline underline-offset-4"
      >
        Back to sign in
      </Link>
    </form>
  );
}
