/**
 * Typed shapes for the Bible.is / DBP4 API responses.
 * Mirrors the contracts documented in DATA.md. Fields the app does not
 * consume are intentionally omitted.
 */

export type FilesetType =
  | "audio"
  | "audio_drama"
  | (string & {});

export interface BibleFileset {
  id: string;
  type: FilesetType;
}

export interface BibleSummary {
  abbr: string;
  name: string;
  language: string;
  /** Keyed by asset host (e.g. "dbp-prod"); each holds an array of filesets. */
  filesets: Record<string, BibleFileset[]>;
}

export type Testament = "OT" | "NT";

export interface BibleBook {
  book_id: string;
  name: string;
  chapters: number;
  testament: Testament;
}

export interface ChapterAudio {
  book_id: string;
  book_name?: string;
  chapter_start: number;
  verse_start: number;
  verse_end: number;
  /** Direct MP3 URL used for inline playback and download. */
  path: string;
}
