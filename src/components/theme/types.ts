export const PAGE_THEMES = [
  "home",
  "search",
  "browse-books",
  "browse-chapters",
  "passage",
  "topics",
  "playlists",
  "login",
  "signup",
] as const;

export type PageTheme = (typeof PAGE_THEMES)[number];
