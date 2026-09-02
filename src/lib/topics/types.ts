import { type PassageRef } from "@/lib/bible/reference";

export type TopicStatus = "draft" | "review" | "published" | "archived";

export interface EditorialTopic {
  slug: string;
  title: string;
  description: string;
  status: TopicStatus;
  displayOrder: number;
  isFeatured: boolean;
  references: string[];
}

export interface TopicSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  isFeatured: boolean;
  passageCount: number;
}

export interface TopicPassage {
  id: string;
  position: number;
  reference: PassageRef;
  displayReference: string;
}

export interface ScriptureTopic extends TopicSummary {
  translationCode: string;
  passages: TopicPassage[];
}
