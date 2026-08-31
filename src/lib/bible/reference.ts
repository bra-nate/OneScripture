export type PassageRef = {
  bookId: string;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
};

/**
 * Canonical book table: Bible.is book_id → display name, plus common aliases.
 * Aliases are matched case-insensitively after whitespace normalisation.
 */
type BookEntry = { id: string; name: string; aliases: string[] };

export type CanonicalBook = BookEntry & {
  chapters: number;
  testament: "OT" | "NT";
};

export const BIBLE_BOOKS: CanonicalBook[] = [
  { id: "GEN", name: "Genesis", chapters: 50, testament: "OT", aliases: [] },
  { id: "EXO", name: "Exodus", chapters: 40, testament: "OT", aliases: [] },
  { id: "LEV", name: "Leviticus", chapters: 27, testament: "OT", aliases: [] },
  { id: "NUM", name: "Numbers", chapters: 36, testament: "OT", aliases: [] },
  { id: "DEU", name: "Deuteronomy", chapters: 34, testament: "OT", aliases: [] },
  { id: "JOS", name: "Joshua", chapters: 24, testament: "OT", aliases: [] },
  { id: "JDG", name: "Judges", chapters: 21, testament: "OT", aliases: [] },
  { id: "RUT", name: "Ruth", chapters: 4, testament: "OT", aliases: [] },
  { id: "1SA", name: "1 Samuel", chapters: 31, testament: "OT", aliases: ["1 sam"] },
  { id: "2SA", name: "2 Samuel", chapters: 24, testament: "OT", aliases: ["2 sam"] },
  { id: "1KI", name: "1 Kings", chapters: 22, testament: "OT", aliases: [] },
  { id: "2KI", name: "2 Kings", chapters: 25, testament: "OT", aliases: [] },
  { id: "1CH", name: "1 Chronicles", chapters: 29, testament: "OT", aliases: ["1 chron"] },
  { id: "2CH", name: "2 Chronicles", chapters: 36, testament: "OT", aliases: ["2 chron"] },
  { id: "EZR", name: "Ezra", chapters: 10, testament: "OT", aliases: [] },
  { id: "NEH", name: "Nehemiah", chapters: 13, testament: "OT", aliases: [] },
  { id: "EST", name: "Esther", chapters: 10, testament: "OT", aliases: [] },
  { id: "JOB", name: "Job", chapters: 42, testament: "OT", aliases: [] },
  { id: "PSA", name: "Psalms", chapters: 150, testament: "OT", aliases: ["psalm", "ps"] },
  { id: "PRO", name: "Proverbs", chapters: 31, testament: "OT", aliases: ["prov"] },
  { id: "ECC", name: "Ecclesiastes", chapters: 12, testament: "OT", aliases: [] },
  { id: "SNG", name: "Song of Solomon", chapters: 8, testament: "OT", aliases: ["song of songs", "song"] },
  { id: "ISA", name: "Isaiah", chapters: 66, testament: "OT", aliases: [] },
  { id: "JER", name: "Jeremiah", chapters: 52, testament: "OT", aliases: [] },
  { id: "LAM", name: "Lamentations", chapters: 5, testament: "OT", aliases: [] },
  { id: "EZK", name: "Ezekiel", chapters: 48, testament: "OT", aliases: [] },
  { id: "DAN", name: "Daniel", chapters: 12, testament: "OT", aliases: [] },
  { id: "HOS", name: "Hosea", chapters: 14, testament: "OT", aliases: [] },
  { id: "JOL", name: "Joel", chapters: 3, testament: "OT", aliases: [] },
  { id: "AMO", name: "Amos", chapters: 9, testament: "OT", aliases: [] },
  { id: "OBA", name: "Obadiah", chapters: 1, testament: "OT", aliases: [] },
  { id: "JON", name: "Jonah", chapters: 4, testament: "OT", aliases: [] },
  { id: "MIC", name: "Micah", chapters: 7, testament: "OT", aliases: [] },
  { id: "NAM", name: "Nahum", chapters: 3, testament: "OT", aliases: [] },
  { id: "HAB", name: "Habakkuk", chapters: 3, testament: "OT", aliases: [] },
  { id: "ZEP", name: "Zephaniah", chapters: 3, testament: "OT", aliases: [] },
  { id: "HAG", name: "Haggai", chapters: 2, testament: "OT", aliases: [] },
  { id: "ZEC", name: "Zechariah", chapters: 14, testament: "OT", aliases: [] },
  { id: "MAL", name: "Malachi", chapters: 4, testament: "OT", aliases: [] },
  { id: "MAT", name: "Matthew", chapters: 28, testament: "NT", aliases: ["matt"] },
  { id: "MRK", name: "Mark", chapters: 16, testament: "NT", aliases: [] },
  { id: "LUK", name: "Luke", chapters: 24, testament: "NT", aliases: [] },
  { id: "JHN", name: "John", chapters: 21, testament: "NT", aliases: [] },
  { id: "ACT", name: "Acts", chapters: 28, testament: "NT", aliases: [] },
  { id: "ROM", name: "Romans", chapters: 16, testament: "NT", aliases: [] },
  { id: "1CO", name: "1 Corinthians", chapters: 16, testament: "NT", aliases: ["1 cor"] },
  { id: "2CO", name: "2 Corinthians", chapters: 13, testament: "NT", aliases: ["2 cor"] },
  { id: "GAL", name: "Galatians", chapters: 6, testament: "NT", aliases: [] },
  { id: "EPH", name: "Ephesians", chapters: 6, testament: "NT", aliases: [] },
  { id: "PHP", name: "Philippians", chapters: 4, testament: "NT", aliases: ["phil"] },
  { id: "COL", name: "Colossians", chapters: 4, testament: "NT", aliases: [] },
  { id: "1TH", name: "1 Thessalonians", chapters: 5, testament: "NT", aliases: ["1 thess"] },
  { id: "2TH", name: "2 Thessalonians", chapters: 3, testament: "NT", aliases: ["2 thess"] },
  { id: "1TI", name: "1 Timothy", chapters: 6, testament: "NT", aliases: ["1 tim"] },
  { id: "2TI", name: "2 Timothy", chapters: 4, testament: "NT", aliases: ["2 tim"] },
  { id: "TIT", name: "Titus", chapters: 3, testament: "NT", aliases: [] },
  { id: "PHM", name: "Philemon", chapters: 1, testament: "NT", aliases: [] },
  { id: "HEB", name: "Hebrews", chapters: 13, testament: "NT", aliases: [] },
  { id: "JAS", name: "James", chapters: 5, testament: "NT", aliases: [] },
  { id: "1PE", name: "1 Peter", chapters: 5, testament: "NT", aliases: ["1 pet"] },
  { id: "2PE", name: "2 Peter", chapters: 3, testament: "NT", aliases: ["2 pet"] },
  { id: "1JN", name: "1 John", chapters: 5, testament: "NT", aliases: [] },
  { id: "2JN", name: "2 John", chapters: 1, testament: "NT", aliases: [] },
  { id: "3JN", name: "3 John", chapters: 1, testament: "NT", aliases: [] },
  { id: "JUD", name: "Jude", chapters: 1, testament: "NT", aliases: [] },
  { id: "REV", name: "Revelation", chapters: 22, testament: "NT", aliases: ["rev"] },
];

const NAME_TO_ID = new Map<string, string>();
const ID_TO_NAME = new Map<string, string>();
for (const b of BIBLE_BOOKS) {
  ID_TO_NAME.set(b.id, b.name);
  NAME_TO_ID.set(b.name.toLowerCase(), b.id);
  for (const a of b.aliases) NAME_TO_ID.set(a.toLowerCase(), b.id);
}

export function getBook(bookId: string): CanonicalBook | null {
  return BIBLE_BOOKS.find((book) => book.id === bookId.toUpperCase()) ?? null;
}

/**
 * Parse a human passage reference like "John 3:16", "John 3:16-17",
 * "Psalms 23", or "1 John 2" into a structured PassageRef.
 * Returns null when the book is unrecognised or the chapter is missing.
 */
export function parseReference(input: string): PassageRef | null {
  const normalised = input.trim().replace(/\s+/g, " ");
  // book name (may include leading number + words) then chapter[:verse[-verse]]
  const match = normalised.match(
    /^(.+?)\s+(\d+)\s*(?::\s*(\d+)\s*(?:-\s*(\d+))?)?$/,
  );
  if (!match) return null;

  const [, rawBook, chapterStr, verseStartStr, verseEndStr] = match;
  const bookId = NAME_TO_ID.get(rawBook.toLowerCase());
  if (!bookId) return null;

  return {
    bookId,
    chapter: Number(chapterStr),
    verseStart: verseStartStr ? Number(verseStartStr) : null,
    verseEnd: verseEndStr ? Number(verseEndStr) : null,
  };
}

/**
 * Format a PassageRef for display, e.g. "John 3:16–17 · ESV".
 * Uses an en-dash between verses and " · " before the translation.
 */
export function formatDisplayRef(ref: PassageRef, translationAbbr: string): string {
  const name = ID_TO_NAME.get(ref.bookId) ?? ref.bookId;
  let passage = `${name} ${ref.chapter}`;
  if (ref.verseStart !== null) {
    passage += `:${ref.verseStart}`;
    if (ref.verseEnd !== null) passage += `–${ref.verseEnd}`;
  }
  return `${passage} · ${translationAbbr}`;
}
