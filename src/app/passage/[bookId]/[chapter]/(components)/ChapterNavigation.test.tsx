import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChapterNavigation } from "@/app/passage/[bookId]/[chapter]/(components)/ChapterNavigation";

describe("ChapterNavigation", () => {
  it("links to adjacent chapters and preserves the translation", () => {
    render(
      <ChapterNavigation
        bookId="JHN"
        chapter={3}
        chapterCount={21}
        translationId="KJV"
      />,
    );

    expect(screen.getByRole("link", { name: "Previous chapter" }).getAttribute("href")).toBe(
      "/passage/JHN/2?translation=KJV",
    );
    expect(screen.getByRole("link", { name: "Next chapter" }).getAttribute("href")).toBe(
      "/passage/JHN/4?translation=KJV",
    );
  });

  it("disables navigation at book boundaries", () => {
    const { rerender } = render(
      <ChapterNavigation
        bookId="JHN"
        chapter={1}
        chapterCount={21}
        translationId="KJV"
      />,
    );

    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Previous chapter" }).disabled).toBe(true);

    rerender(
      <ChapterNavigation
        bookId="JHN"
        chapter={21}
        chapterCount={21}
        translationId="KJV"
      />,
    );

    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Next chapter" }).disabled).toBe(true);
  });
});
