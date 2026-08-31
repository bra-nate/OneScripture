import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { buildAudioStoragePath } from "@/lib/audio/paths";
import { AUDIO_BUCKET, AUDIO_MIME_TYPE } from "@/lib/audio/types";

const AUDIO_FILE = path.resolve(
  process.cwd(),
  "artifacts/kokoro-phase0/john-3-16.mp3",
);
const MODEL_ID = "hexgrad/Kokoro-82M";
const MODEL_VERSION = "kokoro-82m-v1.0-f3ff357";
const VOICE_ID = "af_heart";
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

interface TranslationRow {
  id: string;
}

interface VerseRow {
  id: number;
  text_hash: string;
}

interface AudioAssetRow {
  id: string;
  storage_path: string | null;
  mime_type: string | null;
  duration_ms: number | null;
  status: string;
}

async function main(): Promise<void> {
  const durationMs = probeDurationMs(AUDIO_FILE);
  const file = readFileSync(AUDIO_FILE);
  const audio = file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength,
  ) as ArrayBuffer;
  const supabase = createAdminClient();

  const { data: translation, error: translationError } = await supabase
    .from("scripture_translations")
    .select("id")
    .eq("code", "WEB")
    .single<TranslationRow>();
  if (translationError || !translation) {
    throw new Error(
      `Unable to load WEB translation: ${translationError?.message ?? "missing row"}`,
    );
  }

  const { data: verse, error: verseError } = await supabase
    .from("scripture_verses")
    .select("id, text_hash")
    .eq("translation_id", translation.id)
    .eq("book_id", "JHN")
    .eq("chapter", 3)
    .eq("verse", 16)
    .single<VerseRow>();
  if (verseError || !verse) {
    throw new Error(
      `Unable to load John 3:16: ${verseError?.message ?? "missing row"}`,
    );
  }

  await ensureAudioStorageBucket(supabase);
  const storagePath = buildAudioStoragePath({
    translationCode: "WEB",
    modelVersion: MODEL_VERSION,
    voiceId: VOICE_ID,
    bookId: "JHN",
    chapter: 3,
    verse: 16,
  });
  const asset = await findOrCreateAsset(supabase, verse);

  await uploadAudioAsset(supabase, storagePath, audio);
  const readyAsset = await markAudioVerseAssetReady(
    supabase,
    asset.id,
    storagePath,
    durationMs,
  );
  const signedUrl = await createSignedAudioUrl(supabase, storagePath);

  await verifyFullResponse(signedUrl, file.byteLength);
  await verifyRangeResponse(signedUrl, file.byteLength);

  const { data: bucket, error: bucketError } = await supabase.storage.getBucket(
    AUDIO_BUCKET,
  );
  if (bucketError || !bucket || bucket.public) {
    throw new Error(
      `Audio bucket is not private: ${bucketError?.message ?? "invalid configuration"}`,
    );
  }
  if (
    readyAsset.status !== "ready" ||
    readyAsset.storage_path !== storagePath ||
    readyAsset.mime_type !== AUDIO_MIME_TYPE ||
    readyAsset.duration_ms !== durationMs
  ) {
    throw new Error("Ready audio asset metadata does not match the uploaded MP3");
  }

  console.log(`Verified private bucket: ${AUDIO_BUCKET}`);
  console.log(`Verified ready asset: ${readyAsset.id}`);
  console.log(`Verified object path: ${storagePath}`);
  console.log(`Verified MP3 bytes: ${file.byteLength}`);
  console.log(`Verified duration: ${durationMs} ms`);
  console.log("Verified signed streaming and HTTP byte-range seeking.");
}

function requireEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function createAdminClient(): SupabaseClient {
  return createClient(
    requireEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function ensureAudioStorageBucket(
  supabase: SupabaseClient,
): Promise<void> {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`Unable to list buckets: ${listError.message}`);

  const configuration = {
    public: false,
    fileSizeLimit: MAX_AUDIO_BYTES,
    allowedMimeTypes: [AUDIO_MIME_TYPE],
  };
  const existing = buckets.find((bucket) => bucket.id === AUDIO_BUCKET);
  const { error } = existing
    ? await supabase.storage.updateBucket(AUDIO_BUCKET, configuration)
    : await supabase.storage.createBucket(AUDIO_BUCKET, configuration);
  if (error) throw new Error(`Unable to configure bucket: ${error.message}`);
}

async function findOrCreateAsset(
  supabase: SupabaseClient,
  verse: VerseRow,
): Promise<AudioAssetRow> {
  const columns = "id, storage_path, mime_type, duration_ms, status";
  const { data: existing, error: findError } = await supabase
    .from("audio_verse_assets")
    .select(columns)
    .eq("scripture_verse_id", verse.id)
    .eq("voice_id", VOICE_ID)
    .eq("model_version", MODEL_VERSION)
    .eq("text_hash", verse.text_hash)
    .maybeSingle<AudioAssetRow>();
  if (findError) throw new Error(`Unable to find audio asset: ${findError.message}`);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("audio_verse_assets")
    .insert({
      scripture_verse_id: verse.id,
      voice_id: VOICE_ID,
      model_id: MODEL_ID,
      model_version: MODEL_VERSION,
      text_hash: verse.text_hash,
    })
    .select(columns)
    .single<AudioAssetRow>();
  if (error || !data) {
    throw new Error(`Unable to create audio asset: ${error?.message ?? "missing row"}`);
  }
  return data;
}

async function uploadAudioAsset(
  supabase: SupabaseClient,
  storagePath: string,
  audio: ArrayBuffer,
): Promise<void> {
  if (audio.byteLength < 1 || audio.byteLength > MAX_AUDIO_BYTES) {
    throw new Error("Audio asset size is outside the allowed range");
  }
  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(storagePath, audio, {
      cacheControl: "3600",
      contentType: AUDIO_MIME_TYPE,
      upsert: true,
    });
  if (error) throw new Error(`Unable to upload audio asset: ${error.message}`);
}

async function markAudioVerseAssetReady(
  supabase: SupabaseClient,
  assetId: string,
  storagePath: string,
  durationMs: number,
): Promise<AudioAssetRow> {
  const { data, error } = await supabase
    .from("audio_verse_assets")
    .update({
      storage_path: storagePath,
      mime_type: AUDIO_MIME_TYPE,
      duration_ms: durationMs,
      status: "ready",
      error_code: null,
      error_message: null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", assetId)
    .select("id, storage_path, mime_type, duration_ms, status")
    .single<AudioAssetRow>();
  if (error || !data) {
    throw new Error(`Unable to update audio asset: ${error?.message ?? "missing row"}`);
  }
  return data;
}

async function createSignedAudioUrl(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(storagePath, 5 * 60);
  if (error || !data?.signedUrl) {
    throw new Error(`Unable to sign audio asset: ${error?.message ?? "missing URL"}`);
  }
  return data.signedUrl;
}

function probeDurationMs(filePath: string): number {
  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || "Unable to probe the Phase 3 MP3");
  }

  const durationMs = Math.round(Number(result.stdout.trim()) * 1000);
  if (!Number.isInteger(durationMs) || durationMs < 1) {
    throw new Error("The Phase 3 MP3 has an invalid duration");
  }
  return durationMs;
}

async function verifyFullResponse(
  signedUrl: string,
  expectedBytes: number,
): Promise<void> {
  const response = await fetch(signedUrl);
  const receivedBytes = (await response.arrayBuffer()).byteLength;
  if (!response.ok || receivedBytes !== expectedBytes) {
    throw new Error(
      `Signed MP3 response failed: HTTP ${response.status}, ${receivedBytes} bytes`,
    );
  }
  if (!response.headers.get("content-type")?.startsWith(AUDIO_MIME_TYPE)) {
    throw new Error("Signed MP3 response has an unexpected content type");
  }
}

async function verifyRangeResponse(
  signedUrl: string,
  expectedBytes: number,
): Promise<void> {
  const response = await fetch(signedUrl, {
    headers: { Range: "bytes=0-1023" },
  });
  const receivedBytes = (await response.arrayBuffer()).byteLength;
  const expectedRange = `bytes 0-1023/${expectedBytes}`;
  if (
    response.status !== 206 ||
    receivedBytes !== 1024 ||
    response.headers.get("content-range") !== expectedRange
  ) {
    throw new Error(
      `Range response failed: HTTP ${response.status}, ${receivedBytes} bytes, ${response.headers.get("content-range") ?? "no range"}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown Phase 3 failure");
  process.exitCode = 1;
});
