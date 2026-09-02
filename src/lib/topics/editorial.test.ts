import { describe, expect, it } from "vitest";

import { parseTopicalCatalogue } from "@/lib/topics/editorial";

const VALID_TOPIC = {
  slug: "peace",
  title: "Peace",
  description: "A reviewed collection of scriptures about the peace of God.",
  status: "review",
  displayOrder: 1,
  isFeatured: true,
  references: ["John 14:27", "Philippians 4:6-7"],
};

describe("parseTopicalCatalogue", () => {
  it("normalizes explicit verses into ordered editorial passages", () => {
    const [topic] = parseTopicalCatalogue([VALID_TOPIC]);

    expect(topic.slug).toBe("peace");
    expect(topic.passages).toEqual([
      {
        position: 1,
        reference: {
          bookId: "JHN",
          chapter: 14,
          verseStart: 27,
          verseEnd: null,
        },
      },
      {
        position: 2,
        reference: {
          bookId: "PHP",
          chapter: 4,
          verseStart: 6,
          verseEnd: 7,
        },
      },
    ]);
  });

  it("rejects whole chapters because topic items require intentional ranges", () => {
    expect(() =>
      parseTopicalCatalogue([
        { ...VALID_TOPIC, references: ["Psalms 23"] },
      ]),
    ).toThrow("explicit verses or ranges");
  });

  it("rejects duplicate slugs before publishing", () => {
    expect(() =>
      parseTopicalCatalogue([
        VALID_TOPIC,
        { ...VALID_TOPIC, displayOrder: 2 },
      ]),
    ).toThrow("duplicate topic slug");
  });
});
