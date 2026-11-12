"use client";

import { useMemo, useRef, useState } from "react";

import {
  VerseList,
  formatVerseReference,
} from "@/app/passage/[bookId]/[chapter]/(components)/VerseList";
import { toggleVerseSelection } from "@/app/passage/[bookId]/[chapter]/(utils)/verseSelection";
import { ScriptureAudioPlayer } from "@/components/player";
import { RetryCurrentPageButton } from "@/components/RetryCurrentPageButton";
import { Button, Status } from "@/components/ui";
import { type PlaylistSummary } from "@/lib/playlists/types";
import { type SelectionTranslationId } from "@/lib/audio/selection-contract";
import { type ScriptureVerse } from "@/lib/scripture/types";

export interface ChapterReaderProps {
  chapterReference: string;
  displayReference: string;
  isSignedIn: boolean;
  playlistErrorMessage: string | null;
  playlists: PlaylistSummary[];
  translationCode: SelectionTranslationId;
  verses: ScriptureVerse[];
}

export function ChapterReader({
  chapterReference,
  displayReference,
  isSignedIn,
  playlistErrorMessage,
  playlists,
  translationCode,
  verses,
}: ChapterReaderProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const lastToggledRef = useRef<number | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<ReadonlySet<number>>(new Set());
  const [singleReference, setSingleReference] = useState<string | null>(null);
  const [activeReference, setActiveReference] = useState<string | null>(null);

  const references = useMemo(() => {
    if (selectedVerses.size > 0) {
      return verses
        .filter((verse) => selectedVerses.has(verse.verse))
        .map(formatVerseReference);
    }
    return [singleReference ?? chapterReference];
  }, [chapterReference, selectedVerses, singleReference, verses]);

  const playerTitle =
    selectedVerses.size > 0
      ? `${selectedVerses.size} selected ${selectedVerses.size === 1 ? "verse" : "verses"}`
      : singleReference
        ? `${singleReference} · ${translationCode}`
        : displayReference;

  function revealPlayer() {
    window.requestAnimationFrame(() => {
      const player = playerRef.current;
      if (!player) return;
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      player.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
      // Keyboard and screen-reader users need to follow the scroll.
      player.focus({ preventScroll: true });
    });
  }

  function handleListen(reference: string | null) {
    setSelectedVerses(new Set());
    lastToggledRef.current = null;
    setSingleReference(reference);
    revealPlayer();
  }

  function handleToggleVerse(verse: number, isRangeExtend: boolean) {
    setSelectedVerses((previous) =>
      toggleVerseSelection({
        anchor: lastToggledRef.current,
        availableVerses: verses.map((candidate) => candidate.verse),
        isRangeExtend,
        selected: previous,
        verse,
      }),
    );
    lastToggledRef.current = verse;
    setSingleReference(null);
  }

  function clearSelection() {
    setSelectedVerses(new Set());
    lastToggledRef.current = null;
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="font-sans text-sm text-text-muted">
          Tick verses to build a selection. Hold Shift to take a range.
        </p>
        <Button
          onClick={() => handleListen(null)}
          size="small"
          variant="secondary"
        >
          Listen to whole passage
        </Button>
      </div>

      <div className="mt-5">
        {playlistErrorMessage && (
          <Status className="mb-5" label="Playlists temporarily unavailable" tone="information">
            <p>{playlistErrorMessage}</p>
            <RetryCurrentPageButton />
          </Status>
        )}
        <VerseList
          activeReference={activeReference}
          isSignedIn={isSignedIn}
          onListen={(reference) => handleListen(reference)}
          onToggleVerse={handleToggleVerse}
          arePlaylistsAvailable={!playlistErrorMessage}
          playlists={playlists}
          translationCode={translationCode}
          selectedVerses={selectedVerses}
          verses={verses}
        />
      </div>

      {selectedVerses.size > 0 && (
        <div className="sticky bottom-4 z-10 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-control border border-border bg-surface-strong px-4 py-3 surface-strong-context">
          <p aria-live="polite" className="font-sans text-sm font-semibold text-text-primary">
            {selectedVerses.size} {selectedVerses.size === 1 ? "verse" : "verses"} selected
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={clearSelection} size="small" variant="ghost">
              Clear
            </Button>
            <Button onClick={revealPlayer} size="small">
              Listen to selection
            </Button>
          </div>
        </div>
      )}

      <div className="mt-8" id="scripture-player" ref={playerRef} tabIndex={-1}>
        <ScriptureAudioPlayer
          onCurrentReferenceChange={setActiveReference}
          references={references}
          title={playerTitle}
          translationCode={translationCode}
        />
      </div>
    </>
  );
}
