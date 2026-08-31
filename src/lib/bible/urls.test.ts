import { expect, test } from "vitest";
import { biblesUrl, booksUrl, chapterAudioUrl } from "@/lib/bible/urls";

const B = "https://4.dbt.io/api/";

test("bibles url", () => {
  expect(biblesUrl(B, "K", "eng")).toBe(
    "https://4.dbt.io/api/bibles?language_code=eng&media=audio&key=K",
  );
});

test("books url", () => {
  expect(booksUrl(B, "K", "ENGESV")).toBe(
    "https://4.dbt.io/api/bibles/books?bible_id=ENGESV&key=K",
  );
});

test("chapter audio url", () => {
  expect(chapterAudioUrl(B, "K", "ENGESVN2DA", "JHN", 3)).toBe(
    "https://4.dbt.io/api/bibles/filesets/ENGESVN2DA/JHN/3?key=K",
  );
});
