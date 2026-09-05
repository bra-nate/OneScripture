import { type PassageRef } from "@/lib/bible/reference";

export interface PlaylistSummary {
  id: string;
  name: string;
  itemCount: number;
}

export interface PlaylistItem {
  id: string;
  displayReference: string;
  position: number;
  reference: PassageRef;
  translationId: string;
}

export interface PlaylistDetail {
  id: string;
  name: string;
  items: PlaylistItem[];
}

export interface PlaylistActionState {
  message: string;
  status: "idle" | "error" | "success";
}

export const INITIAL_PLAYLIST_ACTION_STATE: PlaylistActionState = {
  message: "",
  status: "idle",
};
