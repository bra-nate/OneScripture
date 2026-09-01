import { describe, expect, it } from "vitest";

import {
  buildSelectionHash,
  MAX_SELECTION_REFERENCES,
  parseCreateSelectionRequest,
  SelectionRequestError,
  type SelectionRequestErrorCode,
} from "@/lib/audio/selection-contract";

describe("Selection API contract", () => {
  it("normalizes the approved translation and preserves reference order", () => {
    expect(
      parseCreateSelectionRequest({
        translationId: " web ",
        voiceId: "af_heart",
        references: [" John 3:16 ", "Psalm 23", "Romans 8:28"],
      }),
    ).toEqual({
      translationId: "WEB",
      voiceId: "af_heart",
      references: ["John 3:16", "Psalm 23", "Romans 8:28"],
    });
  });

  const invalidRequests: Array<[unknown, SelectionRequestErrorCode]> = [
    [{ voiceId: "af_heart", references: ["John 3:16"] }, "unsupported_translation"],
    [
      { translationId: "WEB", voiceId: "voice-clone", references: ["John 3:16"] },
      "unsupported_voice",
    ],
    [{ translationId: "WEB", voiceId: "af_heart", references: [] }, "invalid_request"],
    [
      {
        translationId: "WEB",
        voiceId: "af_heart",
        references: Array.from({ length: MAX_SELECTION_REFERENCES + 1 }, () => "John 3:16"),
      },
      "invalid_request",
    ],
  ];

  it.each(invalidRequests)("rejects an invalid request with a stable code", (body, code) => {
    expect(() => parseCreateSelectionRequest(body)).toThrowError(
      expect.objectContaining<Partial<SelectionRequestError>>({ code }),
    );
  });

  it("hashes the canonical ordered verse identity deterministically", () => {
    const input = {
      translationId: "translation-uuid",
      voiceId: "am_michael" as const,
      scriptureVerseIds: [101, 102, 103],
    };
    const first = buildSelectionHash(input);

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(buildSelectionHash(input)).toBe(first);
    expect(
      buildSelectionHash({ ...input, scriptureVerseIds: [103, 102, 101] }),
    ).not.toBe(first);
    expect(buildSelectionHash({ ...input, voiceId: "af_heart" })).not.toBe(first);
  });
});
