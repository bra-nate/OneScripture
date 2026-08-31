import { type AudioStoragePathInput } from "@/lib/audio/types";

const TRANSLATION_PATTERN = /^[A-Z0-9_-]{2,16}$/u;
const VERSION_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,127}$/u;
const VOICE_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/u;
const BOOK_PATTERN = /^(?:[1-3][A-Z]{2}|[A-Z]{3})$/u;

export function buildAudioStoragePath({
  translationCode,
  modelVersion,
  voiceId,
  bookId,
  chapter,
  verse,
}: AudioStoragePathInput): string {
  if (!TRANSLATION_PATTERN.test(translationCode)) {
    throw new Error("Invalid audio translation code");
  }
  if (!VERSION_PATTERN.test(modelVersion)) {
    throw new Error("Invalid audio model version");
  }
  if (!VOICE_PATTERN.test(voiceId)) {
    throw new Error("Invalid audio voice ID");
  }
  if (!BOOK_PATTERN.test(bookId)) {
    throw new Error("Invalid audio book ID");
  }
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 999) {
    throw new Error("Invalid audio chapter");
  }
  if (!Number.isInteger(verse) || verse < 1 || verse > 999) {
    throw new Error("Invalid audio verse");
  }

  return [
    translationCode,
    modelVersion,
    voiceId,
    bookId,
    String(chapter).padStart(3, "0"),
    `${String(verse).padStart(3, "0")}.mp3`,
  ].join("/");
}
