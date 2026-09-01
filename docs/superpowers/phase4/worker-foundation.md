# Phase 4 — Kokoro worker runbook

**Completed:** 2026-09-01

**Status:** Complete

## Delivered

- A Python 3.12.14 slim Bookworm image running as non-root UID/GID 10001.
- Exact Kokoro, CPU-only PyTorch, spaCy English model, media, and Supabase
  dependencies. The approved Kokoro revision and both voice artifacts are
  SHA-256 verified before the worker accepts a job.
- A single model/pipeline instance reused by the durable worker loop.
- Service-role-only Postgres RPCs for atomic `FOR UPDATE SKIP LOCKED` claims,
  completion, bounded retry, and stale-lock recovery.
- Canonical text and text-hash checks before synthesis.
- Mono 24 kHz, 64 kbit/s MP3 encoding with loudness normalization to -18 LUFS,
  FFprobe format/duration/size validation, and a 10 MiB output ceiling.
- Deterministic private object paths and idempotent uploads, followed by an
  atomic asset/job completion transition.
- Structured JSON lifecycle logs without credentials.
- A two-CPU, 5-GiB Compose limit, one-job concurrency, automatic temporary-file
  cleanup, persistent model cache, and `unless-stopped` restart policy.

## Database deployment

`supabase/migrations/0004_kokoro_worker.sql` was applied to the hosted
OneScripture project on 2026-09-01. Supabase SQL Editor returned `Success. No
rows returned`.

The database functions are executable by `service_role` only. A stale lock is
requeued while attempts remain and becomes a terminal failure after the final
allowed attempt. Asset state is changed in the same database transaction as its
job state.

## Verification evidence

Local gates:

```sh
npm run worker:test
npm run lint -- --no-cache
npx tsc --noEmit
docker compose -f worker/compose.yaml config
```

- 10 worker unit/integration tests passed, including accepted MP3 encoding,
  canonical paths, success cleanup, transient retry cleanup, and permanent
  text-hash rejection.
- ESLint and TypeScript passed.
- Final Linux ARM64 image: `worker-kokoro-worker:latest`.
- Image ID:
  `sha256:204e9b631041a7f39b3617ae15ef98db20bd46c13c41a61ab0a9cf4c9e4c9cd6`.
- Unpacked image size: 1,841,238,147 bytes (1.84 GB).
- Container configuration check passed with FFmpeg and FFprobe 5.1.9.

Hosted failure-recovery and generation proof:

- Target: WEB John 3:17, voice `am_michael`.
- Asset: `8cac3013-1aab-4bf0-9572-2f7c0925de1c`.
- Job: `609c5959-3ba6-4820-9a1b-f6888cb850d0`.
- Attempt 1 was deliberately abandoned and recovered to `queued` by the hosted
  stale-lock RPC.
- Attempt 2 was deliberately recorded as retryable and returned to `queued`.
- The real container claimed attempt 3, generated a 7,368 ms MP3, uploaded it,
  and atomically completed the asset and job.
- Canonical object path:
  `WEB/kokoro-82m-v1.0-f3ff357/am_michael/JHN/003/017.mp3`.
- Verification found exactly one ready asset and one completed job, confirmed a
  signed `206 Partial Content` MP3 response, and confirmed a repeat identity
  upsert reused the same asset.
- A subsequent real worker `--once` run reported `processed: false`, proving no
  duplicate work remained after completion.

## Operations

Copy `worker/worker.env.example` to the ignored `worker/worker.env`, supply the
hosted Supabase URL and service-role key, then run:

```sh
docker compose -f worker/compose.yaml run --rm kokoro-worker --check
docker compose -f worker/compose.yaml up -d kokoro-worker
docker compose -f worker/compose.yaml logs -f kokoro-worker
```

The named `kokoro-model-cache` volume avoids redownloading verified model
artifacts. The image pre-creates the mount point with UID/GID 10001 ownership so
a fresh volume remains writable without running the worker as root.
