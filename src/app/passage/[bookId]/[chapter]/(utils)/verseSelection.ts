/**
 * Verse tick/untick with shift-to-extend, kept pure so the range maths is
 * testable without mounting the reader.
 */
export function toggleVerseSelection({
  anchor,
  availableVerses,
  isRangeExtend,
  selected,
  verse,
}: {
  anchor: number | null;
  availableVerses: number[];
  isRangeExtend: boolean;
  selected: ReadonlySet<number>;
  verse: number;
}): Set<number> {
  const next = new Set(selected);

  if (isRangeExtend && anchor !== null) {
    const [from, to] = anchor < verse ? [anchor, verse] : [verse, anchor];
    for (const candidate of availableVerses) {
      if (candidate >= from && candidate <= to) next.add(candidate);
    }
    return next;
  }

  if (next.has(verse)) next.delete(verse);
  else next.add(verse);
  return next;
}
