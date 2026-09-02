import { parseReference, type PassageRef } from "@/lib/bible/reference";
import { validatePassageReference } from "@/lib/scripture/passages";
import { type EditorialTopic, type TopicStatus } from "@/lib/topics/types";

const TOPIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const TOPIC_STATUSES = new Set<TopicStatus>([
  "draft",
  "review",
  "published",
  "archived",
]);
const MAX_TOPIC_PASSAGES = 20;

export interface EditorialPassage {
  reference: PassageRef & { verseStart: number };
  position: number;
}

export interface ParsedEditorialTopic extends Omit<EditorialTopic, "references"> {
  passages: EditorialPassage[];
}

export function parseTopicalCatalogue(input: unknown): ParsedEditorialTopic[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("The topical catalogue must contain at least one topic.");
  }

  const topics = input.map(parseTopic);
  assertUnique(topics.map((topic) => topic.slug), "topic slug");
  assertUnique(
    topics.map((topic) => String(topic.displayOrder)),
    "display order",
  );
  return topics;
}

function parseTopic(value: unknown, index: number): ParsedEditorialTopic {
  if (!isRecord(value)) throw new Error(`Topic ${index + 1} must be an object.`);

  const slug = requireString(value.slug, `Topic ${index + 1} slug`);
  const title = requireString(value.title, `Topic ${slug} title`);
  const description = requireString(
    value.description,
    `Topic ${slug} description`,
  );
  const status = parseStatus(value.status, slug);
  const displayOrder = requirePositiveInteger(
    value.displayOrder,
    `Topic ${slug} displayOrder`,
  );

  if (!TOPIC_SLUG_PATTERN.test(slug)) {
    throw new Error(`Topic ${slug} must use a lowercase kebab-case slug.`);
  }
  if (title.length > 80) throw new Error(`Topic ${slug} title is too long.`);
  if (description.length < 20 || description.length > 240) {
    throw new Error(`Topic ${slug} description must contain 20–240 characters.`);
  }
  if (typeof value.isFeatured !== "boolean") {
    throw new Error(`Topic ${slug} isFeatured must be true or false.`);
  }
  if (!Array.isArray(value.references) || value.references.length === 0) {
    throw new Error(`Topic ${slug} requires at least one scripture reference.`);
  }
  if (value.references.length > MAX_TOPIC_PASSAGES) {
    throw new Error(
      `Topic ${slug} may contain at most ${MAX_TOPIC_PASSAGES} passages.`,
    );
  }

  const references = value.references.map((reference, referenceIndex) =>
    parsePassage(reference, slug, referenceIndex),
  );
  assertUnique(
    references.map(({ reference }) => JSON.stringify(reference)),
    `scripture reference in ${slug}`,
  );

  return {
    slug,
    title,
    description,
    status,
    displayOrder,
    isFeatured: value.isFeatured,
    passages: references,
  };
}

function parsePassage(
  value: unknown,
  slug: string,
  index: number,
): EditorialPassage {
  const input = requireString(value, `Reference ${index + 1} in ${slug}`);
  const reference = parseReference(input);
  if (!reference) throw new Error(`Invalid scripture reference in ${slug}: ${input}`);

  validatePassageReference(reference);
  if (reference.verseStart === null) {
    throw new Error(
      `Topical passages must use explicit verses or ranges: ${input}`,
    );
  }

  return {
    reference: { ...reference, verseStart: reference.verseStart },
    position: index + 1,
  };
}

function parseStatus(value: unknown, slug: string): TopicStatus {
  if (typeof value !== "string" || !TOPIC_STATUSES.has(value as TopicStatus)) {
    throw new Error(`Topic ${slug} has an unsupported status.`);
  }
  return value as TopicStatus;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

function requirePositiveInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value) || Number(value) < 1) {
    throw new Error(`${field} must be a positive integer.`);
  }
  return Number(value);
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`The catalogue contains a duplicate ${label}.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
