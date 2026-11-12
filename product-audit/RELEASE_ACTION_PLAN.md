# Release Action Plan

Detailed execution steps, dependencies, rollback points, and acceptance gates are in [`docs/superpowers/plans/2026-10-22-product-readiness-fixes.md`](../docs/superpowers/plans/2026-10-22-product-readiness-fixes.md).

## Immediate — clear P1 blockers

1. **Complete and operate the restored backend** — Owner: platform/backend.
   - Supabase, Auth, canonical WEB data, and private storage are online and verified.
   - Apply missing migration 0005 and publish the validated topical catalogue.
   - Restore the Kokoro worker, investigate the 67 jobs queued since 3 September, and drain them safely.
   - Exit criterion: topic RLS/publishing passes, queue age is healthy, and a new/reused audio selection plays end to end.

2. **Patch production dependencies** — Owner: frontend/platform security.
   - **Complete in working tree:** Next.js 16.4.2 resolves the Next.js/Sharp advisories and `source-map-js` is 1.2.2.
   - Review each advisory against Vercel/Linux and used Next.js features; do not rely only on platform mitigation.
   - Exit criterion: no critical/high production audit findings and full regression suite passes.

3. **Create current E2E release evidence** — Owner: QA/frontend/backend.
   - Seed a safe preview environment and synthetic users.
   - Automate anonymous passage/audio, topic playback, auth/recovery, two-user playlist isolation, worker failure/retry, and outage recovery.
   - Retain screenshots/traces/logs from preview runs.
   - Exit criterion: every P1 journey is PASS with no skips.

4. **Complete production auth** — Owner: frontend/platform.
   - **Code complete:** password recovery request and update flows are implemented.
   - Configure production site/redirect URLs; verify confirmation/recovery delivery and expired-token behavior.
   - Exit criterion: J04 and J11 pass on the production origin using test identities.

5. **Make monitoring operational** — Owner: operations.
   - Configure `ONESCRIPTURE_APP_URL`, disk path, service credentials, schedule, alert destination, and on-call ownership.
   - Run healthy and injected-failure drills.
   - Exit criterion: complete health report exits 0 when healthy and alerts correctly on warning/critical states.

## Short term — P2 correctness and trust

6. [x] Replace generic catalogue fallbacks with typed timeout/configuration/service states and retry actions. Preview fault-injection verification remains in the E2E gate.
7. [x] Fix auth-link contrast with a dark interactive-text treatment. Full route-level accessibility verification remains in the E2E gate.
8. [x] Stop converting playlist service errors into empty/not-found/silent mutation results; add explicit failure UI and mutation acknowledgement. Hosted two-user RLS read/update/insert isolation passed with disposable users on 12 November 2026.
9. Add bounded backend timeouts/circuit behavior so passage/topic outage states complete within the agreed SLO.
10. Reconcile `README.md`, `PRD.md`, and `SCREEN-FLOW.md` with `PHASE.md`; clearly archive superseded download/multi-language scope.

## Medium term — polish and verification depth

11. [x] Increase small text-link hit areas. Keyboard/screen-reader verification remains in the E2E gate.
12. [x] Fix duplicated metadata suffixes. Browser metadata verification remains in the E2E gate.
13. [x] Hide disabled OAuth providers until they are enabled; the final hosted login form contains no “setup pending” controls.
14. Replace the all-Inter typography stack or explicitly accept it as the product's design decision; reduce repetitive rounded-surface usage where hierarchy does not need a container.

## Retest checklist

- [x] `npm audit --omit=dev` has no critical/high production findings.
- [x] Frontend tests, worker tests, lint, typecheck/build, and topic validation pass.
- [ ] Catalogue contains exactly the approved WEB corpus and public reads/service-only writes pass.
- [ ] Anonymous search and browse both end in visible scripture and playable audio.
- [ ] Topic directory/detail/order/playback pass.
- [ ] Female/male voices, once/repeat, speed, volume, refresh persistence, and signed-URL renewal pass.
- [ ] Signup, confirmation, login, logout, recovery, and expired-token flows pass on release origin.
- [ ] Two-user playlist RLS isolation and create/add/remove/play persistence pass.
- [ ] Transient worker error retries; permanent failure is actionable; no duplicate asset/job is produced.
- [ ] Passage/topic outage UI appears inside SLO with accurate copy and a successful retry path.
- [x] 360/375, 768, 1280/1440 widths have no overflow and critical controls remain available on the hosted POC routes checked.
- [ ] WCAG AA automated scan and keyboard/manual checks pass; auth links are at least 4.5:1.
- [ ] Health command runs on schedule; test warning/critical alerts reach the on-call destination.
- [ ] Backup retention is recorded and an isolated restore drill has current evidence.

## Exact release conditions

Release can be reconsidered only when:

1. OS-002 through OS-005 plus OS-013 and OS-014 are closed with observed evidence; OS-001 is already closed.
2. J01–J06, J10, and J11 are executed in preview/production-like infrastructure and pass.
3. No verified P0/P1 finding remains.
4. The P2 outage, contrast, playlist-integrity, and latency issues are fixed or explicitly accepted by the product owner with a dated risk record.
5. The production deployment URL, backend project, worker, monitoring, alerting, and backup ownership are named and verifiable.
