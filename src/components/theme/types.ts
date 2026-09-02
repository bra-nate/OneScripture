export const PAGE_THEMES = [
  "home",
  "search",
  "browse-books",
  "browse-chapters",
  "passage",
  "topics",
  "dashboard",
  "playlists",
  "history",
  "favourites",
  "settings",
  "login",
  "signup",
  "download",
] as const;

export type PageTheme = (typeof PAGE_THEMES)[number];
