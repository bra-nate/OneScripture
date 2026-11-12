import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RetryCurrentPageButton } from "@/components/RetryCurrentPageButton";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("RetryCurrentPageButton", () => {
  it("refreshes the current route", () => {
    render(<RetryCurrentPageButton />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(refresh).toHaveBeenCalledOnce();
  });
});
