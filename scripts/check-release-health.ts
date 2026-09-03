import { statfsSync } from "node:fs";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  classifyMaximum,
  classifyMinimum,
  DEFAULT_RELEASE_HEALTH_THRESHOLDS,
  getAgeSeconds,
  getOverallHealth,
  type HealthStatus,
} from "@/lib/operations/releaseHealth";
import { AUDIO_BUCKET } from "@/lib/audio/types";

interface HealthCheck {
  message: string;
  name: string;
  status: HealthStatus;
  value?: number | string;
}

interface TimestampRow {
  created_at?: string;
  locked_at?: string;
}

interface HealthReport {
  checkedAt: string;
  checks: HealthCheck[];
  overall: HealthStatus;
}

const FAILED_JOB_WINDOW_MINUTES = 15;
const REQUEST_TIMEOUT_MS = 10_000;

async function main(): Promise<void> {
  const checkedAt = new Date();
  const supabase = createAdminClient();
  const checks = [
    await checkDatabase(supabase),
    await checkQueueAge(supabase, checkedAt.getTime()),
    await checkProcessingAge(supabase, checkedAt.getTime()),
    await checkFailedJobs(supabase, checkedAt),
    await checkStorage(supabase),
    await checkApplication(),
    checkDisk(),
  ];
  const overall = getOverallHealth(checks.map(({ status }) => status));
  const report: HealthReport = {
    checkedAt: checkedAt.toISOString(),
    overall,
    checks,
  };
  console.log(JSON.stringify(report));
  if (overall !== "ok") await sendWebhookAlert(report);
  process.exitCode = overall === "critical" ? 2 : overall === "warning" ? 1 : 0;
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

async function checkDatabase(client: SupabaseClient): Promise<HealthCheck> {
  const { error } = await client
    .from("scripture_translations")
    .select("id", { count: "exact", head: true })
    .limit(1);
  return error
    ? critical("database", `Database query failed: ${error.message}`)
    : ok("database", "Database query succeeded");
}

async function checkQueueAge(
  client: SupabaseClient,
  now: number,
): Promise<HealthCheck> {
  const { data, error } = await client
    .from("audio_generation_jobs")
    .select("created_at")
    .eq("status", "queued")
    .lte("available_at", new Date(now).toISOString())
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<TimestampRow>();
  if (error) return critical("queue_age_seconds", `Queue query failed: ${error.message}`);
  const age = getAgeSeconds(data?.created_at ?? null, now);
  return {
    name: "queue_age_seconds",
    status: classifyMaximum(
      age,
      DEFAULT_RELEASE_HEALTH_THRESHOLDS.queueAgeWarningSeconds,
      DEFAULT_RELEASE_HEALTH_THRESHOLDS.queueAgeCriticalSeconds,
    ),
    value: age,
    message: data ? `Oldest available job has waited ${age} seconds` : "No jobs are waiting",
  };
}

async function checkProcessingAge(
  client: SupabaseClient,
  now: number,
): Promise<HealthCheck> {
  const { data, error } = await client
    .from("audio_generation_jobs")
    .select("locked_at")
    .eq("status", "processing")
    .order("locked_at", { ascending: true })
    .limit(1)
    .maybeSingle<TimestampRow>();
  if (error) {
    return critical("processing_age_seconds", `Processing query failed: ${error.message}`);
  }
  const age = getAgeSeconds(data?.locked_at ?? null, now);
  return {
    name: "processing_age_seconds",
    status: classifyMaximum(
      age,
      DEFAULT_RELEASE_HEALTH_THRESHOLDS.processingAgeWarningSeconds,
      DEFAULT_RELEASE_HEALTH_THRESHOLDS.processingAgeCriticalSeconds,
    ),
    value: age,
    message: data ? `Oldest worker lock is ${age} seconds old` : "No jobs are processing",
  };
}

async function checkFailedJobs(
  client: SupabaseClient,
  now: Date,
): Promise<HealthCheck> {
  const windowStart = new Date(
    now.getTime() - FAILED_JOB_WINDOW_MINUTES * 60 * 1_000,
  ).toISOString();
  const { count, error } = await client
    .from("audio_generation_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed")
    .gte("completed_at", windowStart);
  if (error) return critical("failed_jobs", `Failure query failed: ${error.message}`);
  const failedJobs = count ?? 0;
  return {
    name: "failed_jobs",
    status: classifyMaximum(
      failedJobs,
      DEFAULT_RELEASE_HEALTH_THRESHOLDS.failedJobsWarning,
      DEFAULT_RELEASE_HEALTH_THRESHOLDS.failedJobsCritical,
    ),
    value: failedJobs,
    message: `${failedJobs} terminal failures in the last ${FAILED_JOB_WINDOW_MINUTES} minutes`,
  };
}

async function checkStorage(client: SupabaseClient): Promise<HealthCheck> {
  const { data, error } = await client.storage.getBucket(AUDIO_BUCKET);
  if (error || !data) {
    return critical("storage", `Audio bucket check failed: ${error?.message ?? "missing bucket"}`);
  }
  if (data.public) return critical("storage", "Audio bucket is unexpectedly public");
  return ok("storage", "Private audio bucket is reachable");
}

async function checkApplication(): Promise<HealthCheck> {
  const baseUrl = requireEnvironment("ONESCRIPTURE_APP_URL").replace(/\/$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}/`, {
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
    if (response.status >= 500) {
      return critical("http", `Application returned HTTP ${response.status}`, response.status);
    }
    if (response.status >= 400) {
      return {
        name: "http",
        status: "warning",
        value: response.status,
        message: `Application returned HTTP ${response.status}`,
      };
    }
    return ok("http", `Application returned HTTP ${response.status}`, response.status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    return critical("http", `Application probe failed: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
}

function checkDisk(): HealthCheck {
  const path = process.env.ONESCRIPTURE_DISK_PATH?.trim() || process.cwd();
  try {
    const stats = statfsSync(path);
    const freePercent = (stats.bavail / stats.blocks) * 100;
    return {
      name: "free_disk_percent",
      status: classifyMinimum(
        freePercent,
        DEFAULT_RELEASE_HEALTH_THRESHOLDS.freeDiskWarningPercent,
        DEFAULT_RELEASE_HEALTH_THRESHOLDS.freeDiskCriticalPercent,
      ),
      value: freePercent,
      message: `${freePercent.toFixed(2)}% available on ${path}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "disk check failed";
    return critical("free_disk_percent", `Disk check failed: ${message}`);
  }
}

function ok(name: string, message: string, value?: number | string): HealthCheck {
  return { name, status: "ok", message, value };
}

function critical(
  name: string,
  message: string,
  value?: number | string,
): HealthCheck {
  return { name, status: "critical", message, value };
}

async function sendWebhookAlert(report: HealthReport): Promise<void> {
  const webhookUrl = process.env.ONESCRIPTURE_ALERT_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;
  const response = await fetch(webhookUrl, {
    body: JSON.stringify(report),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Alert webhook returned HTTP ${response.status}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown monitoring failure";
  console.error(JSON.stringify({ overall: "critical", error: message }));
  process.exitCode = 2;
});
