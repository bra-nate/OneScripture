"use client";

import { useEffect, useRef, useState } from "react";

import {
  createAudioSelectionService,
  getAudioSelectionService,
  retryAudioSelectionService,
} from "@/components/player/audioSelectionClient";
import {
  type AudioSelectionItem,
  type PlaybackVoiceId,
} from "@/components/player/types";

const POLL_INTERVAL_MS = 2_000;

export type AudioSelectionState =
  | { status: "idle" }
  | {
      status: "preparing";
      selectionId: string;
      ready: number;
      total: number;
    }
  | { status: "ready"; selectionId: string; items: AudioSelectionItem[] }
  | { status: "error"; selectionId: string | null; message: string };

export interface UseAudioSelectionReturn {
  prepare: (voiceId: PlaybackVoiceId) => Promise<void>;
  refreshItems: () => Promise<AudioSelectionItem[]>;
  reset: () => void;
  retry: () => Promise<void>;
  state: AudioSelectionState;
}

export function useAudioSelection(
  references: string[],
): UseAudioSelectionReturn {
  const requestIdRef = useRef(0);
  const [state, setState] = useState<AudioSelectionState>({ status: "idle" });

  async function prepare(voiceId: PlaybackVoiceId) {
    const requestId = ++requestIdRef.current;
    let selectionId: string | null = null;
    setState({ status: "preparing", selectionId: "", ready: 0, total: references.length });
    try {
      const summary = await createAudioSelectionService(references, voiceId);
      selectionId = summary.selectionId;
      if (requestId !== requestIdRef.current) return;
      const selection = await getAudioSelectionService(summary.selectionId);
      if (requestId !== requestIdRef.current) return;
      setState(toSelectionState(selection));
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setState({ status: "error", selectionId, message: getErrorMessage(error) });
    }
  }

  function reset() {
    requestIdRef.current += 1;
    setState({ status: "idle" });
  }

  async function refreshItems(): Promise<AudioSelectionItem[]> {
    if (state.status !== "ready") {
      throw new Error("The audio selection is not ready to refresh.");
    }
    const selection = await getAudioSelectionService(state.selectionId);
    const refreshed = toSelectionState(selection);
    if (refreshed.status !== "ready") {
      throw new Error("The refreshed audio selection is no longer ready.");
    }
    return refreshed.items;
  }

  async function retry() {
    if (state.status !== "error" || !state.selectionId) {
      setState({ status: "idle" });
      return;
    }
    const selectionId = state.selectionId;
    const requestId = ++requestIdRef.current;
    setState({ status: "preparing", selectionId, ready: 0, total: references.length });
    try {
      const selection = await retryAudioSelectionService(selectionId);
      if (requestId === requestIdRef.current) setState(toSelectionState(selection));
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setState({ status: "error", selectionId, message: getErrorMessage(error) });
    }
  }

  useEffect(() => {
    if (state.status !== "preparing" || !state.selectionId) return;
    let isActive = true;
    const timer = window.setTimeout(async () => {
      try {
        const selection = await getAudioSelectionService(state.selectionId);
        if (isActive) setState(toSelectionState(selection));
      } catch (error) {
        if (!isActive) return;
        setState({
          status: "error",
          selectionId: state.selectionId,
          message: getErrorMessage(error),
        });
      }
    }, POLL_INTERVAL_MS);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [state]);

  return { prepare, refreshItems, reset, retry, state };
}

function toSelectionState(
  selection: Awaited<ReturnType<typeof getAudioSelectionService>>,
): AudioSelectionState {
  if (selection.status === "ready") {
    return {
      status: "ready",
      selectionId: selection.selectionId,
      items: [...selection.items].sort((left, right) => left.position - right.position),
    };
  }
  if (selection.status === "failed" || selection.status === "partially_failed") {
    return {
      status: "error",
      selectionId: selection.selectionId,
      message:
        selection.status === "partially_failed"
          ? "Some verses could not be prepared. Retry the incomplete selection."
          : "The audio selection could not be prepared. You can retry it now.",
    };
  }
  return {
    status: "preparing",
    selectionId: selection.selectionId,
    ready: selection.ready,
    total: selection.total,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The audio selection could not be prepared.";
}
