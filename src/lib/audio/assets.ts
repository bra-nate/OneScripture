import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  AUDIO_MIME_TYPE,
  type AudioAssetIdentity,
  type AudioVerseAsset,
  type ReadyAudioAssetInput,
} from "@/lib/audio/types";

interface AudioAssetRow {
  id: string;
  scripture_verse_id: number;
  voice_id: string;
  model_id: string;
  model_version: string;
  text_hash: string;
  storage_path: string | null;
  mime_type: string | null;
  duration_ms: number | null;
  status: AudioVerseAsset["status"];
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

const AUDIO_ASSET_COLUMNS =
  "id, scripture_verse_id, voice_id, model_id, model_version, text_hash, storage_path, mime_type, duration_ms, status, error_code, error_message, created_at, updated_at, completed_at";

export async function findAudioVerseAsset(
  identity: AudioAssetIdentity,
): Promise<AudioVerseAsset | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("audio_verse_assets")
    .select(AUDIO_ASSET_COLUMNS)
    .eq("scripture_verse_id", identity.scriptureVerseId)
    .eq("voice_id", identity.voiceId)
    .eq("model_version", identity.modelVersion)
    .eq("text_hash", identity.textHash)
    .maybeSingle<AudioAssetRow>();

  if (error) throw new Error(`Unable to find audio asset: ${error.message}`);
  return data ? mapAudioAsset(data) : null;
}

export async function createPendingAudioVerseAsset(
  identity: AudioAssetIdentity,
): Promise<AudioVerseAsset> {
  const existing = await findAudioVerseAsset(identity);
  if (existing) return existing;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("audio_verse_assets")
    .insert({
      scripture_verse_id: identity.scriptureVerseId,
      voice_id: identity.voiceId,
      model_id: identity.modelId,
      model_version: identity.modelVersion,
      text_hash: identity.textHash,
    })
    .select(AUDIO_ASSET_COLUMNS)
    .single<AudioAssetRow>();

  if (error || !data) {
    if (error?.code === "23505") {
      const concurrentAsset = await findAudioVerseAsset(identity);
      if (concurrentAsset) return concurrentAsset;
    }
    throw new Error(`Unable to create audio asset: ${error?.message ?? "missing row"}`);
  }
  return mapAudioAsset(data);
}

export async function markAudioVerseAssetReady(
  assetId: string,
  input: ReadyAudioAssetInput,
): Promise<AudioVerseAsset> {
  if (!Number.isInteger(input.durationMs) || input.durationMs < 1) {
    throw new Error("Audio duration must be a positive integer");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("audio_verse_assets")
    .update({
      storage_path: input.storagePath,
      mime_type: AUDIO_MIME_TYPE,
      duration_ms: input.durationMs,
      status: "ready",
      error_code: null,
      error_message: null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", assetId)
    .select(AUDIO_ASSET_COLUMNS)
    .single<AudioAssetRow>();

  if (error || !data) {
    throw new Error(`Unable to mark audio asset ready: ${error?.message ?? "missing row"}`);
  }
  return mapAudioAsset(data);
}

function mapAudioAsset(row: AudioAssetRow): AudioVerseAsset {
  return {
    id: row.id,
    scriptureVerseId: row.scripture_verse_id,
    voiceId: row.voice_id,
    modelId: row.model_id,
    modelVersion: row.model_version,
    textHash: row.text_hash,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    durationMs: row.duration_ms,
    status: row.status,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}
