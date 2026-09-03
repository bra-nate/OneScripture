# PHASE.md — OneScripture Kokoro MVP

## Source of truth

The active rebuild plan is
[`docs/superpowers/plans/2026-08-30-self-hosted-kokoro-verse-audio-mvp.md`](docs/superpowers/plans/2026-08-30-self-hosted-kokoro-verse-audio-mvp.md).
It supersedes the earlier Bible.is/download-oriented Phase 1 roadmap.

The MVP uses the existing hosted Supabase project. Self-hosted Supabase remains
a future migration option and must not be started without a separate decision.

## Phase 0 — Rights and technical proof (Complete)

- [x] Approve the World English Bible (`engwebp`) source and rights.
- [x] Pin Kokoro-82M and the `af_heart` and `am_michael` voices.
- [x] Generate, measure, validate, and listen to the required proof samples.
- [x] Record the accepted MP3 settings and source hashes.

Evidence:
[`docs/superpowers/phase0/kokoro-rights-and-proof.md`](docs/superpowers/phase0/kokoro-rights-and-proof.md)

## Phase 1 — Hosted Supabase platform (Complete for development)

- [x] Resume and verify the existing hosted Supabase project.
- [x] Apply the auth and persistence schema.
- [x] Verify signup, login, logout, profile creation, protected routes, and RLS.
- [x] Keep project credentials in ignored environment files.

Release gates still tracked separately:

- [ ] Configure production site and redirect URLs.
- [ ] Verify production confirmation and recovery email delivery.
- [ ] Repeat auth and protected-route checks on the production origin.
- [ ] Document the hosted backup/PITR and recovery procedure before accepting
      production data.

Evidence:
[`docs/superpowers/phase1/hosted-platform-runbook.md`](docs/superpowers/phase1/hosted-platform-runbook.md)

## Phase 2 — Scripture catalogue (Complete)

- [x] Add scripture translation and canonical verse migrations.
- [x] Add capability fields, public-read RLS, and service-only writes.
- [x] Pin and validate the official WEB source artifact.
- [x] Compute deterministic verse text hashes.
- [x] Add reference validation and selection-normalization tests.
- [x] Render canonical scripture text on the passage page.
- [x] Apply `0002_scripture_catalogue.sql` to hosted Supabase.
- [x] Import and verify all 31,103 WEB verse records.
- [x] Verify public reads and denied anonymous/authenticated writes.
- [x] Verify real chapter, single-verse, range, multi-reference, missing-passage,
      and invalid-reference behavior against hosted Supabase.
- [x] Exercise search → passage rendering in the browser.

Phase 2 is complete when all supported references resolve to canonical ordered
verse records and invalid references are rejected against the deployed
catalogue.

Evidence:
[`docs/superpowers/phase2/scripture-catalogue-runbook.md`](docs/superpowers/phase2/scripture-catalogue-runbook.md)

## Phase 3 — Audio catalogue and storage (Complete)

Asset, job, selection, and selection-item tables; private storage; signed URLs;
HTTP range requests; typed server-side storage services.

- [x] Add audio asset, generation job, selection, and selection-item migrations.
- [x] Add constraints, indexes, status validation, grants, and RLS.
- [x] Create the private `scripture-audio` storage bucket.
- [x] Verify upload, signed playback URLs, and HTTP range requests.
- [x] Add typed server-only asset and storage services.

Evidence:
[`docs/superpowers/phase3/audio-catalogue-storage-runbook.md`](docs/superpowers/phase3/audio-catalogue-storage-runbook.md)

## Phase 4 — Kokoro worker (Complete)

Durable job claiming, verse generation, MP3 conversion, upload, retry, recovery,
logging, and resource limits.

- [x] Containerize the Python worker and pin its runtime dependencies.
- [x] Load the pinned Kokoro model and voice once per worker process.
- [x] Implement atomic job claiming and idempotent asset generation.
- [x] Validate output, convert to accepted MP3 settings, upload, and mark ready.
- [x] Add bounded retries, abandoned-job recovery, structured logs, and resource
      limits.
- [x] Verify one enqueued verse produces exactly one reusable ready asset and
      recovers safely from worker failure.

Evidence:
[`docs/superpowers/phase4/worker-foundation.md`](docs/superpowers/phase4/worker-foundation.md)

## Remaining MVP phases

### Phase 5 — Selection API (Complete)

Selection creation/status/retry routes, limits, rate limiting, asset reuse, and
deterministic readiness responses.

- [x] Define and test the bounded request, voice, hashing, and response contract.
- [x] Add atomic selection, asset, job, and rate-limit orchestration.
- [x] Implement create, status, and retry routes.
- [x] Verify ready-asset reuse and missing-asset enqueue behavior.
- [x] Verify one verse, range, chapter, and unrelated-reference selections.

Evidence:
[`docs/superpowers/phase5/selection-api-foundation.md`](docs/superpowers/phase5/selection-api-foundation.md)

### Phase 6 — Vibrant design-system foundation (Complete)

Route themes, shared primitives, static grain, accessible foregrounds, and
responsive shared chrome.

- [x] Add canonical brand, foundation-neutral, semantic-state, and page tokens.
- [x] Add a typed deterministic route-theme registry.
- [x] Add the local static grain texture and shared page canvas.
- [x] Create shared button, field, status, and surface primitives.
- [x] Refactor shared navigation and footer for responsive themed contexts.
- [x] Apply and visually verify every route theme and foreground pairing.

Evidence:
[`docs/superpowers/phase6/design-system-foundation.md`](docs/superpowers/phase6/design-system-foundation.md)

### Phase 7 — Playback MVP (Complete)

Ordered verse playback, preparation states, looping, voice/speed/volume controls,
preference persistence, preloading, and responsive behavior.

- [x] Establish the ordered selection client and versioned playback preferences.
- [x] Add preparation, ready, empty, failure, and retry states.
- [x] Add ordered playback, next/previous, play-once/repeat, voice, speed,
  volume, current-reference, and next-verse preloading controls.
- [x] Connect passage and topical scripture pages to the selection API.
- [x] Verify refresh behavior and long-running loops in supported browsers.

Evidence:
[`docs/superpowers/phase7/playback-mvp.md`](docs/superpowers/phase7/playback-mvp.md)

### Phase 8 — Legacy removal and release safety (Complete)

Remove Bible.is and arbitrary-download behavior from the product flow, update
copy, add operational monitoring, and run recovery and accessibility checks.

- [x] Remove the Bible.is client, audio resolver, spike, and obsolete types.
- [x] Remove the public download page and arbitrary remote-MP3 proxy.
- [x] Remove download promises and download-specific theme/advertising tokens
  from the active product UI.
- [x] Add queue-age, failed-job, disk-space, database-health, and HTTP-error
  monitoring with actionable thresholds.
- [x] Run and record backup-restore, storage-loss, worker-restart, and
  expired-signed-URL recovery drills.
- [x] Complete responsive and accessibility verification for the player.

Evidence:
[`docs/superpowers/phase8/legacy-removal-and-release-safety.md`](docs/superpowers/phase8/legacy-removal-and-release-safety.md)
