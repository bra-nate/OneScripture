import { describe, expect, test } from "vitest";

import { buildAudioStoragePath } from "@/lib/audio/paths";

const VALID_PATH_INPUT = {
  translationCode: "WEB",
  modelVersion: "kokoro-82m-v1.0-f3ff357",
  voiceId: "af_heart",
  bookId: "JHN",
  chapter: 3,
  verse: 16,
} as const;

describe("audio storage paths", () => {
  test("builds a canonical zero-padded MP3 path", () => {
    expect(buildAudioStoragePath(VALID_PATH_INPUT)).toBe(
      "WEB/kokoro-82m-v1.0-f3ff357/af_heart/JHN/003/016.mp3",
    );
  });

  test.each([
    { ...VALID_PATH_INPUT, translationCode: "web" },
    { ...VALID_PATH_INPUT, modelVersion: "bad/version" },
    { ...VALID_PATH_INPUT, voiceId: "Heart Voice" },
    { ...VALID_PATH_INPUT, bookId: "JOHN" },
    { ...VALID_PATH_INPUT, chapter: 0 },
    { ...VALID_PATH_INPUT, verse: 1000 },
  ])("rejects an unsafe path input %#", (input) => {
    expect(() => buildAudioStoragePath(input)).toThrow();
  });
});
