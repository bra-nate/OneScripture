import { describe, expect, it } from "vitest";

import { getPageTheme } from "@/components/theme/pageThemes";

describe("getPageTheme", () => {
  it.each([
    ["/", "home"],
    ["/search", "search"],
    ["/browse", "browse-books"],
    ["/browse/JHN", "browse-chapters"],
    ["/passage/JHN/3", "passage"],
    ["/topics", "topics"],
    ["/topics/peace", "topics"],
    ["/dashboard", "dashboard"],
    ["/playlist", "playlists"],
    ["/history", "history"],
    ["/favourites", "favourites"],
    ["/settings", "settings"],
    ["/login", "login"],
    ["/signup", "signup"],
  ] as const)("maps %s to %s", (pathname, theme) => {
    expect(getPageTheme(pathname)).toBe(theme);
  });

  it("uses the home theme for an unknown route", () => {
    expect(getPageTheme("/not-found")).toBe("home");
  });
});
