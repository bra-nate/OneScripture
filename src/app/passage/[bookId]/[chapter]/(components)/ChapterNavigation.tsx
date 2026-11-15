import { Button, ButtonLink } from "@/components/ui";
import { routes } from "@/config/routes";

export interface ChapterNavigationProps {
  bookId: string;
  chapter: number;
  chapterCount: number;
  translationId: string;
}

export function ChapterNavigation({
  bookId,
  chapter,
  chapterCount,
  translationId,
}: ChapterNavigationProps) {
  return (
    <nav aria-label="Chapter navigation" className="mt-8 flex gap-3">
      {chapter > 1 ? (
        <ButtonLink
          href={routes.passage(
            { bookId, chapter: chapter - 1, verseStart: null, verseEnd: null },
            translationId,
          )}
          size="small"
          variant="secondary"
        >
          Previous chapter
        </ButtonLink>
      ) : (
        <Button disabled size="small" variant="secondary">
          Previous chapter
        </Button>
      )}

      {chapter < chapterCount ? (
        <ButtonLink
          href={routes.passage(
            { bookId, chapter: chapter + 1, verseStart: null, verseEnd: null },
            translationId,
          )}
          size="small"
          variant="secondary"
        >
          Next chapter
        </ButtonLink>
      ) : (
        <Button disabled size="small" variant="secondary">
          Next chapter
        </Button>
      )}
    </nav>
  );
}
