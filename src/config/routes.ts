import { type PassageRef } from "@/lib/bible/reference";

export const routes = {
  home: "/",
  search: "/search",
  browse: "/browse",
  playlists: {
    index: "/playlist",
    detail: (playlistId: string) => `/playlist/${encodeURIComponent(playlistId)}`,
  },
  forgotPassword: "/forgot-password",
  login: "/login",
  signup: "/signup",
  updatePassword: "/update-password",
  topics: {
    index: "/topics",
    detail: (slug: string) => `/topics/${encodeURIComponent(slug)}`,
  },
  passage: (reference: PassageRef, translation?: string) => {
    const pathname = `/passage/${reference.bookId}/${reference.chapter}`;
    const search = new URLSearchParams();
    if (translation) search.set("translation", translation);
    if (reference.verseStart !== null) {
      search.set("verseStart", String(reference.verseStart));
    }
    if (reference.verseEnd !== null) {
      search.set("verseEnd", String(reference.verseEnd));
    }
    const query = search.toString();
    return query ? `${pathname}?${query}` : pathname;
  },
} as const;
