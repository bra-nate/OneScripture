import { serializePassageRef } from "@/lib/bible/reference";
import { type ScriptureTopic } from "@/lib/topics/types";

export function buildTopicSelectionReferences(topic: ScriptureTopic): string[] {
  return topic.passages.map((passage) => serializePassageRef(passage.reference));
}
