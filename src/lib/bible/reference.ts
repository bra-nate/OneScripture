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

const BOOKS: BookEntry[] = [
  { id: "GEN", name: "Genesis", aliases: [] },
  { id: "EXO", name: "Exodus", aliases: [] },
  { id: "LEV", name: "Leviticus", aliases: [] },
  { id: "NUM", name: "Numbers", aliases: [] },
  { id: "DEU", name: "Deuteronomy", aliases: [] },
  { id: "JOS", name: "Joshua", aliases: [] },
  { id: "JDG", name: "Judges", aliases: [] },
  { id: "RUT", name: "Ruth", aliases: [] },
  { id: "1SA", name: "1 Samuel", aliases: ["1 sam"] },
  { id: "2SA", name: "2 Samuel", aliases: ["2 sam"] },
  { id: "1KI", name: "1 Kings", aliases: [] },
  { id: "2KI", name: "2 Kings", aliases: [] },
  { id: "1CH", name: "1 Chronicles", aliases: ["1 chron"] },
  { id: "2CH", name: "2 Chronicles", aliases: ["2 chron"] },
  { id: "EZR", name: "Ezra", aliases: [] },
  { id: "NEH", name: "Nehemiah", aliases: [] },
  { id: "EST", name: "Esther", aliases: [] },
  { id: "JOB", name: "Job", aliases: [] },
  { id: "PSA", name: "Psalms", aliases: ["psalm", "ps"] },
  { id: "PRO", name: "Proverbs", aliases: ["prov"] },
  { id: "ECC", name: "Ecclesiastes", aliases: [] },
  { id: "SNG", name: "Song of Solomon", aliases: ["song of songs", "song"] },
  { id: "ISA", name: "Isaiah", aliases: [] },
  { id: "JER", name: "Jeremiah", aliases: [] },
  { id: "LAM", name: "Lamentations", aliases: [] },
  { id: "EZK", name: "Ezekiel", aliases: [] },
  { id: "DAN", name: "Daniel", aliases: [] },
  { id: "HOS", name: "Hosea", aliases: [] },
  { id: "JOL", name: "Joel", aliases: [] },
  { id: "AMO", name: "Amos", aliases: [] },
  { id: "OBA", name: "Obadiah", aliases: [] },
  { id: "JON", name: "Jonah", aliases: [] },
  { id: "MIC", name: "Micah", aliases: [] },
  { id: "NAM", name: "Nahum", aliases: [] },
  { id: "HAB", name: "Habakkuk", aliases: [] },
  { id: "ZEP", name: "Zephaniah", aliases: [] },
  { id: "HAG", name: "Haggai", aliases: [] },
  { id: "ZEC", name: "Zechariah", aliases: [] },
  { id: "MAL", name: "Malachi", aliases: [] },
  { id: "MAT", name: "Matthew", aliases: ["matt"] },
  { id: "MRK", name: "Mark", aliases: [] },
  { id: "LUK", name: "Luke", aliases: [] },
  { id: "JHN", name: "John", aliases: [] },
  { id: "ACT", name: "Acts", aliases: [] },
  { id: "ROM", name: "Romans", aliases: [] },
  { id: "1CO", name: "1 Corinthians", aliases: ["1 cor"] },
  { id: "2CO", name: "2 Corinthians", aliases: ["2 cor"] },
  { id: "GAL", name: "Galatians", aliases: [] },
  { id: "EPH", name: "Ephesians", aliases: [] },
  { id: "PHP", name: "Philippians", aliases: ["phil"] },
  { id: "COL", name: "Colossians", aliases: [] },
  { id: "1TH", name: "1 Thessalonians", aliases: ["1 thess"] },
  { id: "2TH", name: "2 Thessalonians", aliases: ["2 thess"] },
  { id: "1TI", name: "1 Timothy", aliases: ["1 tim"] },
  { id: "2TI", name: "2 Timothy", aliases: ["2 tim"] },
  { id: "TIT", name: "Titus", aliases: [] },
  { id: "PHM", name: "Philemon", aliases: [] },
  { id: "HEB", name: "Hebrews", aliases: [] },
  { id: "JAS", name: "James", aliases: [] },
  { id: "1PE", name: "1 Peter", aliases: ["1 pet"] },
  { id: "2PE", name: "2 Peter", aliases: ["2 pet"] },
  { id: "1JN", name: "1 John", aliases: [] },
  { id: "2JN", name: "2 John", aliases: [] },
  { id: "3JN", name: "3 John", aliases: [] },
  { id: "JUD", name: "Jude", aliases: [] },
  { id: "REV", name: "Revelation", aliases: ["rev"] },
];

const NAME_TO_ID = new Map<string, string>();
const ID_TO_NAME = new Map<string, string>();
for (const b of BOOKS) {
  ID_TO_NAME.set(b.id, b.name);
  NAME_TO_ID.set(b.name.toLowerCase(), b.id);
  for (const a of b.aliases) NAME_TO_ID.set(a.toLowerCase(), b.id);
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
