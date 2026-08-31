import { bibleClient } from "@/lib/bible/client";
import { formatDisplayRef, type PassageRef } from "@/lib/bible/reference";
import { getTranslation } from "@/lib/bible/translations";

export type ResolvedAudio = {
  audioUrl: string;
  displayRef: string;
  filesetId: string;
  translationId: string;
  translationLabel: string;
  verseEnd: number | null;
};

export async function resolveChapterAudio(
  ref: PassageRef,
  translationId?: string | null,
): Promise<ResolvedAudio> {
  const translation = getTranslation(translationId);
  const bibles = await bibleClient.listBibles(translation.languageCode);
  const bible = bibles.find((candidate) => candidate.abbr === translation.id);

  if (!bible) {
    throw new Error(
      `${translation.id} was not returned by Bible.is for ${translation.languageCode}.`,
    );
  }

  const fileset = Object.values(bible.filesets ?? {})
    .flat()
    .find((candidate) => candidate.type?.startsWith("audio"));

  if (!fileset) {
    throw new Error(`${translation.id} does not expose an audio fileset.`);
  }

  const chapters = await bibleClient.getChapterAudio(
    fileset.id,
    ref.bookId,
    ref.chapter,
  );
  const chapter = chapters[0];

  if (!chapter?.path) {
    throw new Error("Bible.is did not return an audio URL for this passage.");
  }

  return {
    audioUrl: chapter.path,
    displayRef: formatDisplayRef(ref, translation.id.replace(/^ENG/, "")),
    filesetId: fileset.id,
    translationId: translation.id,
    translationLabel: translation.label,
    verseEnd: ref.verseEnd ?? chapter.verse_end ?? null,
  };
}

export function audioFilename(displayRef: string): string {
  return `${displayRef
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")}.mp3`;
}
