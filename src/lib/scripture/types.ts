import { type PassageRef } from "@/lib/bible/reference";

export interface ScriptureTranslation {
  id: string;
  code: string;
  name: string;
  languageCode: string;
  sourceName: string;
  sourceVersion: string;
  attribution: string;
  canGenerateAudio: boolean;
  canStreamAudio: boolean;
}

export interface ScriptureVerse {
  id: number;
  translationId: string;
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
  textHash: string;
}

export interface CanonicalPassage {
  reference: PassageRef;
  translation: ScriptureTranslation;
  verses: ScriptureVerse[];
}

export interface NormalizedScriptureSelection {
  translationCode: string;
  verses: ScriptureVerse[];
}
