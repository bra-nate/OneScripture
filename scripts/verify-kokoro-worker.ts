import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const MODEL_ID = "hexgrad/Kokoro-82M";
const MODEL_VERSION = "kokoro-82m-v1.0-f3ff357";
const VOICE_ID = "am_michael";
const TRANSLATION_CODE = "WEB";
const BOOK_ID = "JHN";
const CHAPTER = 3;
const VERSE = 17;
const AUDIO_BUCKET = "scripture-audio";

interface VerseRow {
  id: number;
  text_hash: string;
}

interface AssetRow {
  id: string;
  status: string;
  storage_path: string | null;
  mime_type: string | null;
  duration_ms: number | null;
}

interface JobRow {
  id: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  error_code: string | null;
}

async function main(): Promise<void> {
  const command = process.argv[2];
  const supabase = createAdminClient();
  const verse = await loadVerse(supabase);

  if (command === "prepare") {
    await prepareRecoveryProof(supabase, verse);
    return;
  }
  if (command === "verify") {
    await verifyCompletedAsset(supabase, verse);
    return;
  }
  throw new Error("Usage: verify-kokoro-worker.ts <prepare|verify>");
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

async function loadVerse(supabase: SupabaseClient): Promise<VerseRow> {
  const { data: translation, error: translationError } = await supabase
    .from("scripture_translations")
    .select("id")
    .eq("code", TRANSLATION_CODE)
    .single<{ id: string }>();
  if (translationError || !translation) {
    throw new Error(`Unable to load WEB: ${translationError?.message ?? "missing row"}`);
  }

  const { data: verse, error } = await supabase
    .from("scripture_verses")
    .select("id, text_hash")
    .eq("translation_id", translation.id)
    .eq("book_id", BOOK_ID)
    .eq("chapter", CHAPTER)
    .eq("verse", VERSE)
    .single<VerseRow>();
  if (error || !verse) {
    throw new Error(`Unable to load John 3:17: ${error?.message ?? "missing row"}`);
  }
  return verse;
}

function assetIdentity(verse: VerseRow) {
  return {
    scripture_verse_id: verse.id,
    voice_id: VOICE_ID,
    model_id: MODEL_ID,
    model_version: MODEL_VERSION,
    text_hash: verse.text_hash,
  };
}

async function prepareRecoveryProof(
  supabase: SupabaseClient,
  verse: VerseRow,
): Promise<void> {
  const { data: existing, error: existingError } = await supabase
    .from("audio_verse_assets")
    .select("id, status, storage_path, mime_type, duration_ms")
    .match(assetIdentity(verse))
    .maybeSingle<AssetRow>();
  if (existingError) throw new Error(`Unable to inspect proof asset: ${existingError.message}`);
  if (existing) {
    throw new Error(
      `John 3:17 ${VOICE_ID} proof asset already exists with status ${existing.status}; choose a fresh proof target before rerunning prepare`,
    );
  }

  const { data: asset, error: assetError } = await supabase
    .from("audio_verse_assets")
    .insert(assetIdentity(verse))
    .select("id, status, storage_path, mime_type, duration_ms")
    .single<AssetRow>();
  if (assetError || !asset) {
    throw new Error(`Unable to create proof asset: ${assetError?.message ?? "missing row"}`);
  }

  const { data: job, error: jobError } = await supabase
    .from("audio_generation_jobs")
    .insert({ audio_verse_asset_id: asset.id, max_attempts: 3 })
    .select("id, status, attempt_count, max_attempts, error_code")
    .single<JobRow>();
  if (jobError || !job) {
    throw new Error(`Unable to enqueue proof job: ${jobError?.message ?? "missing row"}`);
  }

  const abandonedClaim = await claim(supabase, "phase4-abandoned-proof");
  if (!abandonedClaim || abandonedClaim.job_id !== job.id || abandonedClaim.attempt_count !== 1) {
    throw new Error("The recovery proof did not claim the newly enqueued job on attempt 1");
  }

  const staleTimestamp = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { error: staleError } = await supabase
    .from("audio_generation_jobs")
    .update({ locked_at: staleTimestamp })
    .eq("id", job.id);
  if (staleError) throw new Error(`Unable to simulate an abandoned lock: ${staleError.message}`);

  const { data: recovery, error: recoveryError } = await supabase.rpc(
    "recover_stale_audio_generation_jobs",
    { p_lock_timeout_seconds: 60 },
  );
  if (recoveryError) throw new Error(`Unable to recover the abandoned lock: ${recoveryError.message}`);
  if (recovery?.[0]?.requeued_count !== 1 || recovery?.[0]?.failed_count !== 0) {
    throw new Error(`Unexpected recovery result: ${JSON.stringify(recovery)}`);
  }

  const retryClaim = await claim(supabase, "phase4-retry-proof");
  if (!retryClaim || retryClaim.job_id !== job.id || retryClaim.attempt_count !== 2) {
    throw new Error("The retry proof did not reclaim the recovered job on attempt 2");
  }
  const { data: nextStatus, error: failError } = await supabase.rpc(
    "fail_audio_generation_job",
    {
      p_job_id: job.id,
      p_worker_id: "phase4-retry-proof",
      p_error_code: "phase4_transient_probe",
      p_error_message: "Intentional Phase 4 bounded-retry verification",
      p_retryable: true,
      p_retry_delay_seconds: 0,
    },
  );
  if (failError || nextStatus !== "queued") {
    throw new Error(`Retry transition failed: ${failError?.message ?? nextStatus}`);
  }

  console.log(`Prepared asset ${asset.id} and job ${job.id}.`);
  console.log("Verified abandoned-lock recovery: attempt 1 requeued.");
  console.log("Verified bounded transient retry: attempt 2 requeued.");
  console.log("The real worker must now complete attempt 3.");
}

async function claim(
  supabase: SupabaseClient,
  workerId: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.rpc("claim_audio_generation_job", {
    p_worker_id: workerId,
    p_lock_timeout_seconds: 60,
  });
  if (error) throw new Error(`Unable to claim proof job: ${error.message}`);
  return data?.[0] ?? null;
}

async function verifyCompletedAsset(
  supabase: SupabaseClient,
  verse: VerseRow,
): Promise<void> {
  const identity = assetIdentity(verse);
  const { data: assets, error: assetsError, count } = await supabase
    .from("audio_verse_assets")
    .select("id, status, storage_path, mime_type, duration_ms", {
      count: "exact",
    })
    .match(identity);
  if (assetsError) throw new Error(`Unable to verify proof asset: ${assetsError.message}`);
  if (count !== 1 || assets?.length !== 1) {
    throw new Error(`Expected exactly one reusable asset, found ${count ?? assets?.length ?? 0}`);
  }
  const asset = assets[0] as AssetRow;
  if (
    asset.status !== "ready" ||
    asset.mime_type !== "audio/mpeg" ||
    !asset.storage_path ||
    !asset.duration_ms ||
    asset.duration_ms < 1
  ) {
    throw new Error(`Worker asset is not ready: ${JSON.stringify(asset)}`);
  }

  const { data: jobs, error: jobsError } = await supabase
    .from("audio_generation_jobs")
    .select("id, status, attempt_count, max_attempts, error_code")
    .eq("audio_verse_asset_id", asset.id);
  if (jobsError) throw new Error(`Unable to verify proof job: ${jobsError.message}`);
  const completed = (jobs ?? []).filter(
    (row: JobRow) => row.status === "completed" && row.attempt_count === 3,
  );
  if (jobs?.length !== 1 || completed.length !== 1) {
    throw new Error(`Expected one completed third-attempt job: ${JSON.stringify(jobs)}`);
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(asset.storage_path, 5 * 60);
  if (signedError || !signed?.signedUrl) {
    throw new Error(`Unable to sign generated audio: ${signedError?.message ?? "missing URL"}`);
  }
  const rangeResponse = await fetch(signed.signedUrl, {
    headers: { Range: "bytes=0-31" },
  });
  if (rangeResponse.status !== 206 || !(rangeResponse.headers.get("content-range") ?? "").startsWith("bytes 0-")) {
    throw new Error(`Generated audio did not support byte ranges (${rangeResponse.status})`);
  }
  const bytes = new Uint8Array(await rangeResponse.arrayBuffer());
  if (bytes.length < 3 || String.fromCharCode(...bytes.slice(0, 3)) !== "ID3") {
    throw new Error("Generated object does not have the expected MP3 header");
  }

  const { data: reused, error: reuseError } = await supabase
    .from("audio_verse_assets")
    .upsert(identity, {
      onConflict: "scripture_verse_id,voice_id,model_version,text_hash",
    })
    .select("id")
    .single<{ id: string }>();
  if (reuseError || reused?.id !== asset.id) {
    throw new Error(`Asset identity was not reused: ${reuseError?.message ?? reused?.id}`);
  }

  console.log(`Verified exactly one reusable ready asset: ${asset.id}`);
  console.log(`Verified completed third-attempt job: ${completed[0].id}`);
  console.log(`Verified MP3 byte-range playback: ${asset.storage_path}`);
  console.log(`Verified duration: ${asset.duration_ms} ms`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
