"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { updatePassword } from "@/app/(auth)/actions";
import { Button, PasswordField, Status } from "@/components/ui";
import { routes } from "@/config/routes";

export function PasswordUpdateForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <PasswordField
        autoComplete="new-password"
        isLabelHidden
        label="New password"
        minLength={6}
        name="password"
        placeholder="New password"
        required
      />
      <PasswordField
        autoComplete="new-password"
        isLabelHidden
        label="Confirm new password"
        minLength={6}
        name="passwordConfirmation"
        placeholder="Confirm new password"
        required
      />
      {error && (
        <Status aria-live="polite" label="Unable to update password" tone="danger">
          {error}
        </Status>
      )}
      <Button isPending={isPending} type="submit">
        Update Password
      </Button>
      <Link
        href={routes.forgotPassword}
        className="text-link-target justify-center text-center font-sans text-sm font-semibold text-text-primary underline underline-offset-4"
      >
        Request a new reset link
      </Link>
    </form>
  );
}
