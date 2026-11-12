import { type AudioSelectionItem } from "@/components/player/types";

/**
 * Holds downloaded verse audio in memory for the life of one player, so a
 * repeating selection replays locally instead of re-downloading every lap.
 * Nothing is persisted: bytes are released when the player unmounts.
 */
export class VerseAudioCache {
  private readonly blobUrls = new Map<string, string>();
  private readonly failed = new Set<string>();

  /** Local blob URL when downloaded, the signed URL if download failed, else undefined. */
  sourceFor(item: AudioSelectionItem): string | undefined {
    const key = audioKey(item.url);
    return this.blobUrls.get(key) ?? (this.failed.has(key) ? item.url : undefined);
  }

  hasAll(items: AudioSelectionItem[]): boolean {
    return items.every((item) => this.blobUrls.has(audioKey(item.url)));
  }

  /** Downloads missing items one at a time, starting at `startIndex` and wrapping. */
  async download(
    items: AudioSelectionItem[],
    startIndex: number,
    signal: AbortSignal,
    onChange: () => void,
  ): Promise<void> {
    for (let offset = 0; offset < items.length; offset += 1) {
      const item = items[(startIndex + offset) % items.length];
      const key = audioKey(item.url);
      if (this.blobUrls.has(key) || this.failed.has(key)) continue;
      try {
        const response = await fetch(item.url, { signal });
        if (!response.ok) throw new Error("Audio download failed");
        const blob = await response.blob();
        if (signal.aborted) return;
        this.blobUrls.set(key, URL.createObjectURL(blob));
      } catch {
        if (signal.aborted) return;
        // Stream this verse from its signed URL for the rest of the session rather
        // than swapping sources mid-playback if a retry later succeeded.
        this.failed.add(key);
      }
      onChange();
    }
  }

  clear(): void {
    for (const url of this.blobUrls.values()) URL.revokeObjectURL(url);
    this.blobUrls.clear();
    this.failed.clear();
  }
}

/** Signed URLs change on every refresh; the storage path before `?` does not. */
export function audioKey(signedUrl: string): string {
  return signedUrl.split("?")[0];
}
