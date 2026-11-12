# Prioritized Findings Backlog

## P1 — release blockers

### OS-013 — Topical scripture tables are missing from deployed Supabase

- **Type:** Confirmed deployment/schema defect
- **Persona & journey:** Anonymous listener and editorial operator; J03
- **Location:** Hosted Supabase versus `supabase/migrations/0005_topical_scriptures.sql`
- **Reproduction:** Read `rest/v1/scripture_topics` with the configured anon key.
- **Expected:** Published topic rows are readable; editorial writes remain service-only.
- **Actual:** PostgREST returns `PGRST205`, table not found in schema cache.
- **Impact:** `/topics` and every topic detail/listening journey are unavailable.
- **Recommended fix:** Apply migration 0005, publish the validated 8 topics/40 passages, refresh the schema cache if needed, and verify RLS.
- **Acceptance test:** Public read returns only published topics; anonymous/authenticated writes fail; service publish succeeds atomically; topic routes and playback order pass.
- **Confidence:** High

### OS-014 — Audio generation worker is not draining the queue

- **Type:** Confirmed operational defect
- **Persona & journey:** All listeners and operations owner; J06/J10
- **Location:** Hosted `audio_generation_jobs`, `audio_verse_assets`, worker deployment
- **Reproduction:** Read status counts and the oldest queued job using the service role.
- **Expected:** Available jobs are claimed promptly and transition to ready or bounded failure.
- **Actual:** 67 queued jobs, 0 processing, 67 pending assets, 0 generating, 18 ready; oldest queued job dates to 3 September 2026.
- **Impact:** Any selection requiring missing narration can remain preparing indefinitely.
- **Recommended fix:** Restore the worker with valid service/storage/model configuration, inspect logs, and allow it to drain without creating duplicate assets.
- **Acceptance test:** Queue age returns below threshold, eligible jobs reach ready or bounded failure, and a new safe test verse is generated/reused once.
- **Confidence:** High

### OS-001 — Configured backend did not resolve locally — **RESOLVED 22 October 2026**

- **Type:** Confirmed defect / external dependency
- **Persona & journey:** All roles; J01–J06 and J10
- **Location:** `.env.local` target used by `src/lib/supabase/*`, scripture/topics/playlists/audio services
- **Reproduction:** Run `npm run scripture:verify`; query the configured public hostname with DNS; open `/passage/JHN/3?verseStart=16`.
- **Expected:** WEB translation resolves; canonical verse renders.
- **Actual:** Initial verification reported `fetch failed` and local DNS returned `NXDOMAIN`. Independent resolvers showed the restored project; local DNS subsequently refreshed. The official verifier and passage text now pass.
- **Impact:** Resolved for canonical scripture access. Topic schema and worker operations remain separate blockers.
- **Recommended fix:** No project replacement is currently required. Continue with OS-013 and OS-014.
- **Acceptance test:** Completed for DNS and canonical catalogue only; broader journeys remain open.
- **Confidence:** High

### OS-002 — Critical/high production dependency vulnerabilities

- **Status:** Resolved in the working tree on 22 October 2026.

- **Type:** Technical/security risk
- **Persona & journey:** All users; all journeys
- **Location:** `package.json` / `package-lock.json` (`next@16.3.0`, transitive `sharp`, `source-map-js`)
- **Reproduction:** Run `npm audit --omit=dev`.
- **Expected:** No known critical/high production vulnerabilities.
- **Actual:** Next.js 16.4.2, Sharp 0.35.5, and `source-map-js` 1.2.2 now return zero production vulnerabilities.
- **Impact:** Potential RCE, denial of service, cache/content leakage, SSRF, or image-processing exposure depending on deployment and used surfaces.
- **Recommended fix:** Upgrade to patched compatible versions, review advisory applicability, and avoid `--force` without testing.
- **Acceptance test:** Production audit has no critical/high findings; 111+ frontend tests, worker tests, lint, build, and E2E suite pass after upgrade.
- **Confidence:** High for dependency exposure; exploitability varies by hosting/features.

### OS-003 — Signature journeys lack current E2E evidence

- **Type:** Test/release gap
- **Persona & journey:** Anonymous and registered listeners; J01–J06
- **Location:** Repository-wide; no Playwright/Cypress E2E suite or `test:e2e` script
- **Reproduction:** Inspect `package.json` and test inventory.
- **Expected:** Automated or repeatable browser tests prove search/browse → canonical text → selection → generation/reuse → playback, plus auth/playlist isolation.
- **Actual:** Unit/component/worker coverage is strong, but critical cross-system journeys are unproved in the current environment.
- **Impact:** A build can pass while the product's primary job is unusable.
- **Recommended fix:** Add an isolated seeded E2E environment and tests for the acceptance journeys in `USER_JOURNEY_MATRIX.md`.
- **Acceptance test:** CI and preview both execute the suite with artifacts; zero critical journey failures or skips.
- **Confidence:** High

### OS-004 — Password recovery is missing

- **Status:** Code complete; hosted configuration and live-email acceptance remain open.

- **Type:** Missing capability / specification gap
- **Persona & journey:** Existing registered listener; J11
- **Location:** `/login`, auth actions/routes; hosted-platform release checklist
- **Reproduction:** Open `/login` and inspect route/actions.
- **Expected:** “Forgot password” starts recovery; callback/reset form completes securely; expired token is recoverable.
- **Actual:** Request/update routes, server actions, account-neutral copy, safe callback destination, and invalid-session handling now exist. Hosted redirect allowlisting and real-email verification are not yet complete.
- **Impact:** Locked-out users cannot independently regain playlist access.
- **Recommended fix:** Implement Supabase reset request and update-password flow with non-enumerating copy and safe redirects.
- **Acceptance test:** Test-account recovery email arrives on production origin; valid reset works; expired/reused link fails safely; login succeeds with new password.
- **Confidence:** High

### OS-005 — Operational health monitor is not configured/runnable

- **Type:** Operational readiness risk
- **Persona & journey:** Operations owner; J10
- **Location:** `scripts/check-release-health.ts`, `ops/monitor.env.example`, runtime environment
- **Reproduction:** Run `npm run release:health`.
- **Expected:** JSON report covers database, queue, processing locks, failures, storage, web, and disk.
- **Actual:** Command exits critical because `ONESCRIPTURE_APP_URL` is required; current backend would fail subsequent checks.
- **Impact:** Incidents can occur without reliable detection or routing.
- **Recommended fix:** Configure production target/disk path/credentials, schedule every minute, connect alert destination, and record on-call ownership.
- **Acceptance test:** Healthy run exits 0; injected warning/critical conditions produce the expected exit code and alert payload.
- **Confidence:** High

## P2 — major issues

### OS-006 — Backend errors are misdiagnosed and unrecoverable in the UI — **RESOLVED IN CODE 22 October 2026**

- **Type:** Confirmed UX/reliability defect
- **Persona & journey:** Anonymous listener; J01–J03
- **Location:** `src/app/passage/[bookId]/[chapter]/page.tsx:78`, topic fallback components
- **Reproduction:** Open a passage with the configured backend unavailable.
- **Expected:** Honest temporary-service message, retry action, and preserved reference.
- **Actual:** Supabase/PostgREST failures now retain timeout, configuration/schema, permission, or general availability categories. Passage and topic fallbacks render non-sensitive category-specific copy and a pending-safe same-route retry, preserving the requested URL and query.
- **Impact:** Users lose trust and cannot tell whether to retry, wait, or report a configuration incident.
- **Recommended fix:** Preserve typed error classes through service boundaries; map unavailable/configuration/timeout states to accurate copy and retry.
- **Acceptance test:** Unit injection verifies timeout/configuration/permission/unavailable classification and non-sensitive copy; the retry component refreshes the current route. A browser failed-then-successful retry remains in the preview E2E gate.
- **Confidence:** High

### OS-007 — Auth cross-link contrast fails WCAG AA

- **Type:** Accessibility defect
- **Persona & journey:** New/existing registered listeners; J04/J11
- **Location:** `src/components/auth/AuthForm.tsx:76-89`, `src/app/globals.css:4`
- **Reproduction:** Inspect computed color on “Sign up →” or “Sign in →”.
- **Expected:** Normal text contrast at least 4.5:1.
- **Actual:** `#8ed462` on white is approximately 1.79:1.
- **Impact:** Low-vision and contrast-sensitive users may miss the alternate auth path.
- **Standard:** WCAG 2.2, 1.4.3 Contrast (Minimum), AA.
- **Recommended fix:** Introduce a dark interactive-text token; retain green as decoration/background.
- **Acceptance test:** Automated contrast scan and manual computed-color check pass default, hover, focus, and visited states at 4.5:1+.
- **Confidence:** High

### OS-008 — Active product scope conflicts with repository documentation

- **Type:** Specification gap
- **Persona & journey:** Product, engineering, QA, operations; all
- **Location:** `README.md`, `PRD.md`, `SCREEN-FLOW.md` versus `PHASE.md`
- **Reproduction:** Compare promised translations/downloads/dashboard/history/favourites with the active Kokoro scope and build route manifest.
- **Expected:** One current product contract with clearly archived history.
- **Actual:** Superseded and active requirements coexist without prominent status in the older top-level documents.
- **Impact:** Wrong release criteria, inaccurate marketing, and rework.
- **Recommended fix:** Update top-level docs to the active MVP; move historical specs under an archive label; add dated decision log and traceability table.
- **Acceptance test:** Every launch feature maps to an implemented route/API and acceptance journey; excluded features are clearly labeled.
- **Confidence:** High

### OS-009 — Playlist persistence failures masquerade as empty/missing/success — **RESOLVED IN CODE 23 October 2026**

- **Type:** Data-trust defect
- **Persona & journey:** Registered listener; J05
- **Location:** `src/lib/playlists/catalogue.ts:28-34,58-73`; `src/app/(main)/playlist/actions.ts:93-109`
- **Reproduction:** Simulate database read/delete errors.
- **Expected:** Error state with retry; delete confirms success only after the database acknowledges it.
- **Actual:** Genuine empty and missing states remain distinct; service failures render retry UI. Add/remove actions check ownership and query results, reject duplicate verses, calculate the next persisted position, and only revalidate after an acknowledged mutation.
- **Impact:** Users may believe saved content disappeared or was removed when the service actually failed.
- **Recommended fix:** Return typed service errors; show non-destructive retry UI; check mutation result and announce success/failure.
- **Acceptance test:** Forced read/delete failures preserve visible data where possible, show an error, and never announce or imply success.
- **Confidence:** High from source and local tests; hosted two-user RLS acceptance remains open.

### OS-010 — Core data routes completed slowly during outage — **RESOLVED WITH BACKEND RESTORATION**

- **Type:** Performance/reliability defect
- **Persona & journey:** Anonymous listener; J01–J03
- **Location:** Server data calls for passage/topics
- **Reproduction:** With current invalid backend, time local responses.
- **Expected:** Failure state within a bounded target such as 2 seconds.
- **Actual:** During outage, `/passage/...` and `/topics` each took about 7.1 seconds. After restoration, passage text completed in about 1.9 seconds and the topic fallback in about 0.3 seconds.
- **Impact:** Users perceive a hang and may retry/abandon.
- **Recommended fix:** Add bounded server request timeouts, short failure caching/circuit behavior, and immediate skeleton-to-error transition.
- **Acceptance test:** Inject unreachable backend; complete error UI in under agreed SLO with no duplicate requests.
- **Confidence:** High for current environment.

## P3 — minor issues

### OS-011 — Several mobile text links are below the 44 px enhanced target size — **RESOLVED IN CODE 23 October 2026**

- **Type:** Accessibility/usability polish
- **Location:** Global nav and editorial/back/auth text links
- **Actual:** Global navigation, editorial/back, and auth text links now expose a minimum 44 px practical target without changing their text treatment.
- **Impact:** Harder activation for users with motor impairments or imprecise touch.
- **Standard:** WCAG 2.5.5 Target Size (Enhanced), AAA; check 2.5.8 spacing exceptions separately.
- **Recommended fix:** Add block padding/min-height while preserving the visual text treatment.
- **Acceptance test:** Interactive target boxes are 44 × 44 px where feasible, with no crowding at 320–375 px widths.

### OS-012 — Topics page title duplicates the brand — **RESOLVED IN CODE 23 October 2026**

- **Type:** SEO/polish defect
- **Location:** `src/app/topics/page.tsx:8-11` plus root metadata template
- **Actual:** Topic index and detail metadata now omit the child brand suffix and rely on the root template to append it once.
- **Impact:** Lower-quality browser/share/search presentation.
- **Recommended fix:** Set the child title to `Topical Scriptures` and let the root template append the brand.
- **Acceptance test:** Browser title contains one brand suffix on index and detail routes.
