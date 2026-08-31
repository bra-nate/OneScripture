import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { AUDIO_BUCKET, AUDIO_MIME_TYPE } from "@/lib/audio/types";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const SIGNED_URL_MIN_SECONDS = 30;
const SIGNED_URL_MAX_SECONDS = 60 * 60;

export async function ensureAudioStorageBucket(): Promise<void> {
  const supabase = createAdminClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`Unable to list storage buckets: ${listError.message}`);

  const configuration = {
    public: false,
    fileSizeLimit: MAX_AUDIO_BYTES,
    allowedMimeTypes: [AUDIO_MIME_TYPE],
  };
  const existing = buckets.find((bucket) => bucket.id === AUDIO_BUCKET);
  const { error } = existing
    ? await supabase.storage.updateBucket(AUDIO_BUCKET, configuration)
    : await supabase.storage.createBucket(AUDIO_BUCKET, configuration);

  if (error) throw new Error(`Unable to configure audio bucket: ${error.message}`);
}

export async function uploadAudioAsset(
  storagePath: string,
  audio: ArrayBuffer,
): Promise<void> {
  if (audio.byteLength < 1 || audio.byteLength > MAX_AUDIO_BYTES) {
    throw new Error("Audio asset size is outside the allowed range");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(storagePath, audio, {
      cacheControl: "3600",
      contentType: AUDIO_MIME_TYPE,
      upsert: true,
    });
  if (error) throw new Error(`Unable to upload audio asset: ${error.message}`);
}

export async function createSignedAudioUrl(
  storagePath: string,
  expiresIn = 5 * 60,
): Promise<string> {
  if (
    !Number.isInteger(expiresIn) ||
    expiresIn < SIGNED_URL_MIN_SECONDS ||
    expiresIn > SIGNED_URL_MAX_SECONDS
  ) {
    throw new Error(
      `Signed URL expiry must be between ${SIGNED_URL_MIN_SECONDS} and ${SIGNED_URL_MAX_SECONDS} seconds`,
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error || !data?.signedUrl) {
    throw new Error(`Unable to sign audio asset: ${error?.message ?? "missing URL"}`);
  }
  return data.signedUrl;
}
