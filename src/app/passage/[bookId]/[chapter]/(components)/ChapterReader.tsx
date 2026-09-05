"use client";

import { useState } from "react";

import { VerseList } from "@/app/passage/[bookId]/[chapter]/(components)/VerseList";
import { ScriptureAudioPlayer } from "@/components/player";
import { Button } from "@/components/ui";
import { type PlaylistSummary } from "@/lib/playlists/types";
import { type ScriptureVerse } from "@/lib/scripture/types";

export interface ChapterReaderProps {
  chapterReference: string;
  displayReference: string;
  isSignedIn: boolean;
  playlists: PlaylistSummary[];
  verses: ScriptureVerse[];
}

export function ChapterReader({
  chapterReference,
  displayReference,
  isSignedIn,
  playlists,
  verses,
}: ChapterReaderProps) {
  const [listeningReference, setListeningReference] = useState(chapterReference);
  const playerTitle = listeningReference === chapterReference
    ? displayReference
    : `${listeningReference} · WEB`;

  function handleListen(reference: string) {
    setListeningReference(reference);
    window.requestAnimationFrame(() => {
      document.getElementById("scripture-player")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <>
      <div className="mt-8 flex justify-end">
        <Button
          aria-pressed={listeningReference === chapterReference}
          onClick={() => handleListen(chapterReference)}
          size="small"
          variant="secondary"
        >
          Listen to displayed passage
        </Button>
      </div>
      <div className="mt-5">
        <VerseList
          isSignedIn={isSignedIn}
          onListen={handleListen}
          playlists={playlists}
          verses={verses}
        />
      </div>
      <div className="mt-8" id="scripture-player">
        <ScriptureAudioPlayer
          key={listeningReference}
          references={[listeningReference]}
          title={playerTitle}
        />
      </div>
    </>
  );
}
