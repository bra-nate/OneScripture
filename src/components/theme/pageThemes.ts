import { type PageTheme } from "@/components/theme/types";

interface RouteThemeRule {
  matches: (pathname: string) => boolean;
  theme: PageTheme;
}

const ROUTE_THEME_RULES: RouteThemeRule[] = [
  { matches: (pathname) => pathname === "/", theme: "home" },
  { matches: (pathname) => pathname === "/search", theme: "search" },
  { matches: (pathname) => pathname === "/browse", theme: "browse-books" },
  { matches: (pathname) => pathname.startsWith("/browse/"), theme: "browse-chapters" },
  { matches: (pathname) => pathname.startsWith("/passage/"), theme: "passage" },
  { matches: (pathname) => pathname.startsWith("/topics"), theme: "topics" },
  { matches: (pathname) => pathname === "/dashboard", theme: "dashboard" },
  { matches: (pathname) => pathname === "/playlist", theme: "playlists" },
  { matches: (pathname) => pathname === "/history", theme: "history" },
  { matches: (pathname) => pathname === "/favourites", theme: "favourites" },
  { matches: (pathname) => pathname === "/settings", theme: "settings" },
  { matches: (pathname) => pathname === "/login", theme: "login" },
  { matches: (pathname) => pathname === "/signup", theme: "signup" },
  { matches: (pathname) => pathname === "/download", theme: "download" },
];

export function getPageTheme(pathname: string): PageTheme {
  return ROUTE_THEME_RULES.find((rule) => rule.matches(pathname))?.theme ?? "home";
}
