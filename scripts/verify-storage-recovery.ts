import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { AUDIO_BUCKET, AUDIO_MIME_TYPE } from "@/lib/audio/types";

const AUDIO_FILE = path.resolve(
  process.cwd(),
  "artifacts/kokoro-phase0/john-3-16.mp3",
);
const EXPIRED_URL_WAIT_MS = 2_500;

async function main(): Promise<void> {
  const client = createAdminClient();
  const audio = await readFile(AUDIO_FILE);
  const objectPath = `release-drills/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.mp3`;

  try {
    await upload(client, objectPath, audio);
    const firstUrl = await sign(client, objectPath, 60);
    await expectAudio(firstUrl, "initial storage object");

    await remove(client, objectPath);
    await expectMissingObject(client, objectPath);

    await upload(client, objectPath, audio);
    const restoredUrl = await sign(client, objectPath, 60);
    await expectAudio(restoredUrl, "restored storage object");

    const expiringUrl = await sign(client, objectPath, 1);
    await expectAudio(expiringUrl, "fresh one-second signed URL");
    await delay(EXPIRED_URL_WAIT_MS);
    await expectUnavailable(expiringUrl);

    const renewedUrl = await sign(client, objectPath, 60);
    await expectAudio(renewedUrl, "renewed signed URL");

    console.log("Verified storage-loss detection and byte-for-byte object restoration.");
    console.log("Verified expired signed URL rejection and fresh-URL recovery.");
  } finally {
    await remove(client, objectPath, true);
  }
}

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
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

async function upload(
  client: SupabaseClient,
  objectPath: string,
  audio: Buffer,
): Promise<void> {
  const body = audio.buffer.slice(
    audio.byteOffset,
    audio.byteOffset + audio.byteLength,
  ) as ArrayBuffer;
  const { error } = await client.storage.from(AUDIO_BUCKET).upload(objectPath, body, {
    cacheControl: "60",
    contentType: AUDIO_MIME_TYPE,
    upsert: false,
  });
  if (error) throw new Error(`Unable to upload recovery object: ${error.message}`);
}

async function remove(
  client: SupabaseClient,
  objectPath: string,
  ignoreMissing = false,
): Promise<void> {
  const { error } = await client.storage.from(AUDIO_BUCKET).remove([objectPath]);
  if (error && !ignoreMissing) {
    throw new Error(`Unable to remove recovery object: ${error.message}`);
  }
}

async function sign(
  client: SupabaseClient,
  objectPath: string,
  expiresIn: number,
): Promise<string> {
  const { data, error } = await client.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(objectPath, expiresIn);
  if (error || !data?.signedUrl) {
    throw new Error(`Unable to sign recovery object: ${error?.message ?? "missing URL"}`);
  }
  return data.signedUrl;
}

async function expectAudio(url: string, label: string): Promise<void> {
  const response = await fetchWithoutCache(url);
  if (response.status !== 206) {
    throw new Error(`${label} returned HTTP ${response.status}; expected 206`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith(AUDIO_MIME_TYPE)) {
    throw new Error(`${label} returned unexpected content type ${contentType}`);
  }
}

async function expectUnavailable(url: string): Promise<void> {
  const response = await fetchWithoutCache(url);
  if (response.ok) {
    throw new Error(`Unavailable storage URL unexpectedly returned HTTP ${response.status}`);
  }
}

async function expectMissingObject(
  client: SupabaseClient,
  objectPath: string,
): Promise<void> {
  const { error } = await client.storage.from(AUDIO_BUCKET).download(objectPath);
  if (!error) throw new Error("Removed recovery object is still present in Storage");
}

function fetchWithoutCache(url: string): Promise<Response> {
  const uncachedUrl = new URL(url);
  uncachedUrl.searchParams.set("release_drill", randomUUID());
  return fetch(uncachedUrl, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Range: "bytes=0-31",
    },
  });
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown recovery failure";
  console.error(message);
  process.exitCode = 1;
});
