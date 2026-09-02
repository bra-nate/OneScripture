import { type PassageRef } from "@/lib/bible/reference";

export const routes = {
  home: "/",
  search: "/search",
  browse: "/browse",
  dashboard: "/dashboard",
  settings: "/settings",
  login: "/login",
  signup: "/signup",
  topics: {
    index: "/topics",
    detail: (slug: string) => `/topics/${encodeURIComponent(slug)}`,
  },
  passage: (reference: PassageRef) => {
    const pathname = `/passage/${reference.bookId}/${reference.chapter}`;
    if (reference.verseStart === null) return pathname;

    const search = new URLSearchParams({
      verseStart: String(reference.verseStart),
    });
    if (reference.verseEnd !== null) {
      search.set("verseEnd", String(reference.verseEnd));
    }
    return `${pathname}?${search.toString()}`;
  },
} as const;
