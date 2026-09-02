import { ButtonLink, Surface } from "@/components/ui";
import { routes } from "@/config/routes";

export interface SearchEmptyStateProps {
  body: string;
  title: string;
}

export function SearchEmptyState({ body, title }: SearchEmptyStateProps) {
  return (
    <Surface className="p-6">
      <h2 className="font-sans text-lg font-semibold text-text-primary">
        {title}
      </h2>
      <p className="mt-2 font-sans text-sm leading-6 text-text-muted">{body}</p>
      <ButtonLink className="mt-5" href={routes.browse} variant="secondary">
        Browse by book
      </ButtonLink>
    </Surface>
  );
}
