import "server-only";

import {
  enforceAudioSelectionRateLimit,
  persistCanonicalAudioSelection,
  type CanonicalSelectionInput,
} from "@/lib/audio/selection-orchestration";
import {
  loadAudioSelectionStatus,
  retryAudioSelection,
} from "@/lib/audio/selection-status";
import { createSignedAudioUrl } from "@/lib/audio/storage";
import { createAdminClient } from "@/lib/supabase/admin";

export function createCanonicalAudioSelection(input: CanonicalSelectionInput) {
  return persistCanonicalAudioSelection(input, createAdminClient());
}

export function enforceCanonicalAudioSelectionRateLimit(rateLimitKey: string) {
  return enforceAudioSelectionRateLimit(rateLimitKey, createAdminClient());
}

export function getCanonicalAudioSelection(
  selectionId: string,
  userId: string | null,
) {
  return loadAudioSelectionStatus(
    selectionId,
    userId,
    createAdminClient(),
    createSignedAudioUrl,
  );
}

export function retryCanonicalAudioSelection(
  selectionId: string,
  userId: string | null,
) {
  return retryAudioSelection(selectionId, userId, createAdminClient());
}
