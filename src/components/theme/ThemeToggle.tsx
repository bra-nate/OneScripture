"use client";

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "onescripture-theme";

type ColorTheme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ColorTheme>("light");

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => {
      const activeTheme = root.dataset.theme === "dark" ? "dark" : "light";
      setTheme(activeTheme);
    };
    const followSystemTheme = () => {
      if (getStoredTheme()) return;
      applyTheme(media.matches ? "dark" : "light");
      syncTheme();
    };

    syncTheme();
    media.addEventListener("change", followSystemTheme);
    return () => media.removeEventListener("change", followSystemTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
    setTheme(nextTheme);
  }

  const isDark = theme === "dark";

  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-transparent text-text-primary transition-colors hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
      onClick={toggleTheme}
      title={isDark ? "Use light mode" : "Use dark mode"}
      type="button"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function applyTheme(theme: ColorTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#151713" : "#f5f1e4");
}

function getStoredTheme(): ColorTheme | null {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "dark" || storedTheme === "light" ? storedTheme : null;
  } catch {
    return null;
  }
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
