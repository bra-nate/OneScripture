import { describe, expect, it } from "vitest";

import { buildTopicSelectionReferences } from "@/lib/topics/selections";
import { type ScriptureTopic } from "@/lib/topics/types";

describe("buildTopicSelectionReferences", () => {
  it("preserves the editorial order expected by the selection API", () => {
    const topic: ScriptureTopic = {
      id: "topic-1",
      slug: "peace",
      title: "Peace",
      description: "Scriptures about peace.",
      isFeatured: true,
      passageCount: 2,
      translationCode: "WEB",
      passages: [
        {
          id: "passage-1",
          position: 1,
          displayReference: "John 14:27",
          reference: {
            bookId: "JHN",
            chapter: 14,
            verseStart: 27,
            verseEnd: null,
          },
        },
        {
          id: "passage-2",
          position: 2,
          displayReference: "Philippians 4:6–7",
          reference: {
            bookId: "PHP",
            chapter: 4,
            verseStart: 6,
            verseEnd: 7,
          },
        },
      ],
    };

    expect(buildTopicSelectionReferences(topic)).toEqual([
      "John 14:27",
      "Philippians 4:6-7",
    ]);
  });
});
