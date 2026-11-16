import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "@/components/theme/ThemeToggle";

describe("ThemeToggle", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
  const media = {
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  beforeEach(() => {
    values.clear();
    document.documentElement.dataset.theme = "light";
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("matchMedia", vi.fn(() => media));
  });

  afterEach(() => {
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = "";
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("switches to dark mode and persists the choice", () => {
    render(<ThemeToggle />);

    const toggle = screen.getByRole("button", { name: "Switch to dark mode" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(toggle);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(storage.getItem("onescripture-theme")).toBe("dark");
    expect(
      screen
        .getByRole("button", { name: "Switch to light mode" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
});
