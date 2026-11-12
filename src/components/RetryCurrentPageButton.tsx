"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui";

export function RetryCurrentPageButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      className="mt-4"
      isPending={isPending}
      onClick={() => startTransition(() => router.refresh())}
      size="small"
      variant="secondary"
    >
      {isPending ? "Trying again…" : "Try again"}
    </Button>
  );
}
