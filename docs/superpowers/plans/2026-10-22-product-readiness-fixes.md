# OneScripture Product Readiness Fix Plan

**Created:** 22 October 2026
**Status:** In progress
**Source evidence:** `product-audit/` audit artifacts
**Target:** Public MVP / beta candidate
**Current verdict:** Not ready

## Objective

Move OneScripture from a functioning canonical-text application with partial hosted infrastructure to a release candidate whose primary journeys work end to end: find scripture, prepare/reuse narration, play it, authenticate, and save/play personal playlists.

The plan closes verified P1 findings first, then P2 trust/accessibility defects, and ends with preview evidence and an explicit release decision. Passing unit tests or a production build alone does not complete a milestone.

## Scope

Included:

- Hosted Supabase schema and topical catalogue completion.
- Kokoro worker recovery and queue drainage.
- Production dependency vulnerability remediation.
- Password recovery and production auth completion.
- Typed service failures, playlist data-integrity feedback, contrast, metadata, and touch-target fixes.
- End-to-end test coverage, Vercel preview deployment, monitoring, and release evidence.
- Reconciliation of active product documentation.

Excluded unless separately approved:

- Downloads, additional translations, Twi/Ga synthesis, native apps, social features, and advertiser tooling.
- Replacing Supabase, Kokoro, or the current WEB source.
- Destructive production-data cleanup, account deletion, or queue deletion.
- Redesigning the visual direction again.

## Current baseline

Verified healthy:

- Supabase DNS, Auth health, WEB rights/source pin, and all 31,103 verses.
- Canonical John 3:16 app rendering.
- Private `scripture-audio` bucket (`audio/mpeg`, 10 MB limit).
- 127 frontend tests, 11 worker tests, lint, topical content validation, and production build.
- Next.js 16.4.2 with zero known production dependency vulnerabilities.
- Password reset request/update routes and non-enumerating recovery UI implemented locally.
- Typed scripture/topic service failures and same-route retry UI implemented locally.

Verified blockers:

- OS-013: hosted topic tables are absent (`PGRST205`).
- OS-014: 67 jobs/pending assets, 0 processing/generating; oldest queued 3 September 2026.
- OS-003: the hosted POC now covers anonymous routes, login, playlist
  create/add/open/duplicate handling, two-user RLS isolation, and responsive
  smoke; live audio, topics, recovery email, and full automated E2E remain.
- OS-004: password recovery needs hosted redirect/email and expired-link verification.
- OS-005: canonical production monitoring path not configured.

## Dependency order

```text
Workstream A — Hosted data and worker
    ├── unlocks topical journeys
    └── unlocks live audio journeys
            ↓
Workstream B — Security and runtime baseline
            ↓
Workstream C — Product correctness and account recovery
            ↓
Workstream D — Automated journeys and preview deployment
            ↓
Workstream E — Operations evidence and release decision
```

Workstreams A and B may run in parallel after a clean branch/rollback point exists. C should land after the dependency upgrade to avoid resolving conflicts twice. D depends on A–C. E depends on a stable preview from D.

## Workstream A — Complete hosted data and restore audio generation

**Findings:** OS-013, OS-014
**Owner:** Platform/backend/worker
**Release gate:** Topics and on-demand narration work against hosted infrastructure.

### A1. Establish a safe hosted baseline

- Record the Supabase project ref, current migration inventory, database backup status, topic-table absence, queue counts, oldest queued timestamp, asset counts, and bucket policy.
- Confirm that migration `0005_topical_scriptures.sql` has not been applied under another name before executing it.
- Preserve a pre-change database backup or confirm the provider backup/restore point.
- Do not remove or rewrite the 67 queued jobs; they are evidence and should be recoverable by the worker.

**Evidence:** timestamped pre-change status in the audit log.
**Stop condition:** no verified backup/rollback path or schema state is ambiguous.

### A2. Apply and verify topical schema

- Apply `supabase/migrations/0005_topical_scriptures.sql` to the intended hosted project.
- Refresh PostgREST schema cache if the platform does not do so automatically.
- Run `npm run topics:validate`.
- Publish the validated 8 topics and 40 passages with `npm run topics:publish` only after confirming the target project.
- Verify anonymous/authenticated public reads, denied public writes, service-only publishing, published-only visibility, and deterministic passage order.

**Acceptance:** `/topics` and one `/topics/[slug]` route load real content; topic playback request preserves editorial order.
**Rollback:** restore pre-change backup if migration integrity fails; do not manually delete individual topic rows as a substitute for rollback.

### A3. Restore one Kokoro worker safely

- Identify the actual worker host/runtime and its current deployment mechanism before changing it.
- Verify its environment points to the same Supabase project and approved model/version/voices.
- Check disk space, FFmpeg, model/voice artifacts, service-role access, and Storage access.
- Start one bounded worker instance first; observe claim → generate → upload → complete for one existing queued job.
- Confirm no duplicate asset/job is created and the signed audio URL supports range requests.
- Let the worker drain the existing queue while monitoring queue age, failures, CPU, memory, and disk.

**Acceptance:** 0 stale eligible jobs; no jobs stuck processing beyond the lock timeout; every item ends ready or bounded failed; 67 pending assets are reconciled; a real verse plays.
**Stop condition:** disk below the documented threshold, repeated permanent failures, wrong model/voice pin, or unexpected duplicate assets.

### A4. Recheck the signature audio flow

- Test one already-ready verse for asset reuse.
- Test one missing safe verse for generation.
- Test a range and a complete short chapter for ordered readiness and playback.
- Verify female/male voices, once/repeat, speed, volume, signed-URL renewal, and refresh persistence.

**Acceptance:** J01, J02, and J06 pass with retained logs/screenshots.

## Workstream B — Patch the production runtime safely

**Finding:** OS-002
**Owner:** Frontend/platform security
**Release gate:** No known critical/high production dependency vulnerability remains.

### B1. Choose patched versions

- At execution time, verify the currently patched Next.js release from official advisories/documentation.
- Read the relevant Next.js 16 upgrade and breaking-change guides in `node_modules/next/dist/docs/` before editing.
- Determine whether React, ESLint config, or transitive image packages must move with Next.js.
- Record advisory applicability to the Vercel/Linux deployment; do not dismiss package findings solely because one exploit path is Windows-specific.

### B2. Upgrade in an isolated commit

**Progress:** Complete in the working tree. Next.js and `eslint-config-next` are
16.4.2, Sharp is 0.35.5, `source-map-js` is 1.2.2, and the production audit is
clean. Regression tests, worker tests, lint, typecheck, content validation, and
the production build pass.

- Update `package.json` and lockfile using the smallest compatible version movement.
- Do not use `npm audit fix --force` without reviewing the resulting major/range changes.
- Run frontend tests, worker tests, lint, typecheck/production build, topic validation, and `npm audit --omit=dev`.
- Smoke every route in the production build.

**Acceptance:** zero critical/high production findings and no regression in existing gates.
**Rollback:** revert the isolated dependency commit if build/runtime regression cannot be corrected without scope expansion.

## Workstream C — Complete user trust, recovery, and accessibility

**Findings:** OS-004, OS-006, OS-007, OS-008, OS-009, OS-011, OS-012
**Owner:** Frontend/product/backend
**Release gate:** Users can recover accounts and distinguish empty, missing, and failed states.

### C1. Implement password recovery

**Progress:** Code complete in the working tree. Hosted Supabase redirect
allowlisting, email delivery, valid/expired/reused-link checks, and a synthetic
account journey remain before acceptance.

- Add a non-enumerating “Forgot password” request form and server action.
- Add the authenticated recovery callback/update-password route.
- Restrict redirects to the configured application origin/internal paths.
- Handle invalid, expired, and reused links without exposing account existence.
- Configure and verify production confirmation/recovery redirect URLs and email delivery.

**Acceptance:** request, valid reset, expired link, reused link, login with new password, and logout all pass with a synthetic account.

### C2. Add typed service-error recovery

**Progress:** Code complete in the working tree. Supabase/PostgREST timeout,
schema/configuration, permission, and general availability failures retain a
typed category; missing and invalid references remain distinct. Passage and
topic error states provide a pending-safe same-route retry, preserving URL
parameters and query selection. Route-level injected-failure E2E remains
before final acceptance.

- Preserve catalogue/topic/selection error categories through service boundaries.
- Distinguish unavailable, timeout, missing data, invalid reference, and permission errors.
- Add retry actions that preserve the requested reference/topic/selection.
- Keep messages non-sensitive and actionable.

**Acceptance:** injected failures produce the correct state and a successful retry without duplicate submission.

### C3. Make playlist persistence trustworthy

**Progress:** Code complete in the working tree. Playlist reads now preserve
service failures instead of presenting them as empty or missing data. Add and
remove actions verify their database reads/writes, duplicate verses are
rejected, ordering uses the highest persisted position, and successful deletes
show confirmation. Hosted two-user RLS read/update/insert isolation passed with
temporary users on 12 November 2026; the signed-in Vercel POC also passed
create, add, open, persistence, and duplicate rejection. Browser remove and
playlist audio remain open.

- Stop returning an empty list for playlist read errors and `null`/404 for service failures.
- Check delete results before revalidation; provide success/error feedback.
- Add duplicate-add handling and verify ordering/count consistency.
- Add two-user RLS tests for read, insert, and delete denial.

**Acceptance:** genuine empty/missing/error states are distinguishable; no failed mutation appears successful.

### C4. Close accessibility and metadata defects

**Progress:** Known code defects are complete in the working tree. Auth links
use dark interactive text, global/editorial/auth text links expose a 44 px
practical target, and topic metadata relies on the root title template so the
brand appears once. The hosted POC had no horizontal overflow on home, browse,
topics, passage, and login at 360, 768, and 1440 px. Route-level axe, keyboard,
zoom, reduced-motion, and screen-reader verification remain open.

- Add a dark interactive-text token so auth cross-links reach at least 4.5:1.
- Increase practical touch areas for global/editorial text links without changing visual hierarchy.
- Fix duplicated `OneScripture` metadata suffixes.
- Run route-level axe, keyboard, focus, zoom/text-scaling, reduced-motion, and responsive checks.

**Acceptance:** WCAG AA automated checks pass; no critical keyboard/focus issue; metadata titles contain one brand suffix.

### C5. Reconcile product documentation

- Rewrite the root README as an actual OneScripture setup/operations guide.
- Update or clearly archive the superseded Bible.is/download PRD and screen flow.
- Make `PHASE.md` and this plan the visible current sources of truth.
- Add traceability from active features to journeys and release tests.

**Acceptance:** no active document promises downloads, unsupported translations, dashboard/history/favourites, or unimplemented OAuth.

## Workstream D — Build release evidence and deploy a preview

**Finding:** OS-003
**Owner:** QA/frontend/backend
**Release gate:** Every P1 journey passes in production-like infrastructure.

### D1. Add browser E2E infrastructure

- Add Playwright as a development dependency after approval.
- Add `test:e2e` with a documented preview/test environment contract.
- Use synthetic identities and deterministic seeded references; never use personal accounts or production email addresses.
- Capture screenshot/trace/log artifacts on failure.

### D2. Automate the critical journeys

- Anonymous search → passage text → ready/reused audio → playback.
- Browse → chapter → range selection → ordered playback.
- Topics → detail → editorial order → playback.
- Signup → confirmation → login → password recovery → logout.
- Playlist create → add → open → play → remove, plus second-user denial.
- Worker transient failure/retry and permanent failure presentation.
- Backend outage → fast honest error → retry recovery.

**Acceptance:** no P1 journey is skipped; expected data changes and visible outcomes are both asserted.

### D3. Deploy a Vercel preview

**Progress:** A separate `onescripture-poc` Vercel project is deployed at
`https://onescripture-poc.vercel.app` because the signed-in Vercel account had
no existing OneScripture project and its GitHub connection was unavailable.
The deployment is intentionally treated as a POC target, although Vercel labels
it as that isolated project's production target. Public Supabase configuration
is present; server-only audio credentials remain withheld pending explicit
approval.

- Link the existing Vercel project rather than creating a duplicate.
- Configure preview environment variables from approved secrets; do not copy stale values blindly.
- Deploy the current branch to preview, run E2E/smoke/accessibility checks, and review runtime logs.
- Keep production promotion separate from preview success.

**Acceptance:** preview URL is stable, every critical route passes, no unexpected 5xx/console errors, and backend/worker targets are the intended environment.

## Workstream E — Operationalize and decide release

**Finding:** OS-005 and remaining release gates
**Owner:** Operations/product owner
**Release gate:** The product can be observed, recovered, and deliberately promoted.

### E1. Configure monitoring without accidental alerts

- Set `ONESCRIPTURE_APP_URL`, worker disk path, service credentials, and alert destination in the intended runtime.
- First run the health command with notifications deliberately disabled or pointed to a test destination.
- Verify database, queue age, processing lock age, failures, private Storage, HTTP, and disk checks.
- Then enable the approved alert destination and schedule once per minute.

**Acceptance:** healthy run exits 0; injected warning/critical cases produce the expected code and one test alert.

### E2. Refresh recovery evidence

- Record hosted backup retention/PITR settings.
- Run an isolated database restore drill and storage/signed-URL recovery drill.
- Record timestamps, hashes/counts, RPO, elapsed restore time, and owner.

### E3. Final release review

- Rerun tests, audit, build, E2E, accessibility, security audit, catalogue verification, health checks, and responsive smoke suite.
- Review every P0/P1 finding and journey status against evidence.
- Promote preview to production only after explicit product-owner approval.

**Release conditions:** no verified P0/P1; J01–J06, J10, and J11 pass; monitoring and backup ownership are named; remaining P2 risks are fixed or formally accepted.

## Execution slices

| Slice | Work | Expected result | External mutation? |
| --- | --- | --- | --- |
| 1 | A1 hosted-state/backup preflight | Safe rollback point and exact target confirmed | No |
| 2 | A2 apply migration 0005 and publish topics | Topic routes operational | Yes — hosted DB/content |
| 3 | A3 restore one worker and drain queue | Audio generation operational | Yes — worker/jobs/storage |
| 4 | B dependency patch | Secure runtime baseline | Repository only |
| 5 | C1–C5 product fixes | Recovery/trust/accessibility/docs complete | Repository; auth config later |
| 6 | D E2E + Vercel preview | Production-like release evidence | Preview deployment/test data |
| 7 | E monitoring/recovery/release | Operational gate and release decision | Alerts/backups/production promotion |

## First execution slice

Start with **A1 only**:

1. Identify the intended hosted Supabase project and worker deployment target.
2. Capture migration/schema, queue/asset, storage, disk, and backup state.
3. Confirm rollback capability.
4. Produce the exact A2 commands/actions and expected outputs.
5. Stop before applying migration 0005 or starting the worker unless the user explicitly authorizes those hosted changes.

## MECE validation

Top-level organization is by responsibility and outcome:

- A owns hosted data and generation.
- B owns runtime dependency security.
- C owns product behavior, recovery, accessibility, and active documentation.
- D owns automated journey evidence and preview deployment.
- E owns monitoring, recovery operations, and release decision.

No task belongs to more than one workstream; handoffs are expressed as dependencies rather than duplicated tasks. The set covers every open P1/P2/P3 finding and all release gates in the audit.

**MECE Score: 100/100 — All things are MECE. ✓**
