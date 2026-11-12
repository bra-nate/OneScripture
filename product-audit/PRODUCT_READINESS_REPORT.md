# OneScripture Product Readiness Report

**Audit date:** 22 October 2026 (GMT)
**Target assessed:** Public MVP / beta candidate defined by `PHASE.md` and the active Kokoro MVP plan
**Verdict:** **NOT READY** for a public MVP or beta
**Evidence confidence:** High for repository quality, canonical scripture, Auth health, storage configuration, topic-schema absence, and queue state; insufficient for an actual production deployment because no production origin or full live user journey was available.

## Executive verdict

OneScripture has a coherent, responsive interface and a strong tested implementation foundation. A 22 October recheck confirmed that Supabase is back online: the official scripture verifier passes, all 31,103 WEB verses are present, and John 3:16 renders in the application. The product is still not release-ready because the topical tables are absent from the deployed schema, 67 audio jobs have been queued since 3 September with no active processing, and the critical journeys still lack production-like end-to-end evidence.

The repository is in much better shape than the live product state: the remediation run upgraded Next.js to 16.4.2, cleared the production dependency audit, added password-recovery routes, and passed 112 frontend tests, 11 worker tests, lint, typecheck, topical-content validation, and a production build. Those checks demonstrate engineering quality, but they do not substitute for a working passage-to-audio journey or hosted recovery-email proof.

### Release gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Product completeness | **Conditional** | Anonymous reference search and browse exist; active-MVP playback, registered playlists, and password recovery exist in code. Production auth delivery and redirect configuration remain unverified. |
| Critical journey completion | **Partial** | Search and browse now reach canonical passage text. Topics fail because their deployed tables are missing, and the stale audio queue prevents confidence in on-demand playback. |
| Functional correctness/data consistency | **Partial** | Canonical scripture integrity passes. Topics schema and current worker throughput fail operational checks. |
| Role/permission safety | **Blocked** | RLS and protected-route tests exist; live multi-user negative-permission checks were not possible. |
| Usability/accessibility/responsiveness | **Partial pass** | No horizontal overflow at 360, 768, or 1440 px. Auth cross-links now use the dark primary text treatment with 44 px practical targets; a current route-level scan and other small-link checks remain. |
| Reliability/error recovery | **Fail** | Outage states render but offer no retry; playlist read/delete failures can look like empty or missing data. |
| Operational readiness | **Fail** | `ONESCRIPTURE_APP_URL` is unset, the deployed topic schema is incomplete, and 67 audio jobs remain queued with no processing jobs. |

## Product understanding

### Mission and signature experience

The active MVP lets a person locate canonical World English Bible text, select one verse, a range, a chapter, or multiple curated references, generate/reuse Kokoro narration, and listen in order once or on repeat. Signed-in users can save individual verses into playlists. Downloads and additional translations/languages are explicitly outside the active MVP.

### Intended roles

| Role | Goal | Trigger | Success criteria |
| --- | --- | --- | --- |
| Anonymous listener | Find and hear scripture quickly | A reference, need, or desire to browse | Canonical text loads; selection prepares; audio plays in order; failures are recoverable. |
| Registered listener | Preserve and replay a personal collection | Wants to keep verses across visits | Can sign up/login, create a playlist, add/remove verses, and replay the collection. |
| Editorial operator | Publish curated topical listening sequences | New or revised topical collection | Valid content publishes atomically and appears in the intended order. |
| Operations/worker owner | Keep synthesis, storage, database, and web app healthy | Queue, deployment, or alert | Health probes run; jobs recover; backups and storage are verifiable; incidents are actionable. |

### Core entities and ownership

- Public catalogue: translations, canonical verses, published topics, topic passages.
- Generated audio: verse assets, generation jobs, selections, ordered selection items.
- User-owned data: profiles, playlists, playlist items, legacy favourites/download tables.
- Operational state: anonymous rate-limit windows, private audio objects, worker locks and retries.

### Specification contradictions

- `PRD.md`, `SCREEN-FLOW.md`, and the stock `README.md` describe the superseded Bible.is/download product, including NIV/ESV/Twi/Ga, downloads, dashboard, history, favourites, and settings.
- `PHASE.md` correctly supersedes that scope with WEB + Kokoro playback, no downloads, and limited playlist work.
- Historical implementation notes claim all hosted phases were complete, but the deployed topic schema and worker state do not match that claim. Completion records are therefore not current release evidence.

## Anti-pattern verdict

**Borderline pass: the UI does not read as generic AI output, but it carries two recognizable template tells.** The cream/editorial palette, route accents, asymmetric hero art, restrained motion, and absence of gradients/glassmorphism are intentional. However, Inter is used for every typographic role, and large rounded white surfaces recur heavily. The result is cohesive and pleasant, but less distinctive than the product promise. This is not a release blocker.

## Coverage summary

- Roles identified: **4**.
- Material journeys discovered: **11**.
- Journeys with executed evidence: **7**; passed **3**, partial **2**, failed **1**, blocked during execution **1**.
- Remaining journeys: **3 blocked**, **1 not run**.
- Application routes inventoried from the production build: **15**.
- Routes browser-smoked: **11** plus one invalid API request.
- Responsive widths checked: **360, 768, and 1440 px**.
- Automated checks: **112/112 frontend tests passed**, **11/11 worker tests passed**, lint and typecheck passed, content validation passed, production build passed.
- Blocked checks: production auth, live audio generation/playback, live playlist/RLS mutation journeys, production health probe, email delivery, backup retention, and physical-device playback.

## Top findings

| ID | Priority | Finding | User impact | Required outcome |
| --- | --- | --- | --- | --- |
| OS-013 | P1 | Deployed Supabase has no topical scripture tables | The need-based topical journey remains unavailable. | Apply migration 0005, publish validated content, and verify RLS. |
| OS-014 | P1 | 67 audio jobs are queued; oldest dates to 3 September; none is processing | Missing narration is not being generated and selections can stall indefinitely. | Restore the worker, drain the queue, and prove new/reused audio behavior. |
| OS-002 | Resolved | Production dependencies were vulnerable | Next.js 16.4.2, Sharp 0.35.5, and `source-map-js` 1.2.2 now produce a zero-vulnerability production audit. | Keep versions pinned and retain audit/build gates. |
| OS-003 | P1 | No current end-to-end proof for the signature passage-to-audio journey | A green build can ship a product whose primary job still fails. | Add and execute browser/API tests against an isolated working environment, including one negative case. |
| OS-004 | P1 partial | Recovery route/action/UI now exist | Hosted redirect allowlisting, email delivery, and valid/expired/reused-link behavior are not yet proved. | Configure Supabase/Vercel and execute the production-like recovery journey. |
| OS-005 | P1 | Release monitoring is not runnable in the current environment | Operators cannot distinguish or alert on database, queue, storage, disk, or HTTP failure. | Set the production app URL and valid service credentials; schedule and alert on the health command. |
| OS-006 | Resolved in code | Catalogue outage states used generic copy and no retry | Typed timeout, configuration, permission, and availability states now render non-sensitive guidance with a same-route retry that preserves the request. Route-level fault-injection remains part of E2E. | Retain the typed boundary and verify failed-then-successful retry in preview. |
| OS-007 | Resolved in code | Auth cross-links used green on white at **1.79:1** | Links now use the dark primary text treatment and underline; automated route-level confirmation remains part of E2E. | Retain the darker treatment and verify in the accessibility run. |
| OS-008 | P2 | Product documentation and active scope conflict | Teams can build, test, sell, or accept the wrong product. | Rewrite the README/PRD/screen flow or mark historical files clearly and link one source of truth. |
| OS-009 | Resolved in code | Playlist read/delete database errors were silently converted to empty/not-found/success-like states | Typed read failures now render retry UI; mutations verify ownership, query results, duplicates, ordering, and deletion before revalidation. Hosted two-user RLS verification remains. | Retain explicit states and complete the two-user acceptance journey. |

The known P3 code defects are resolved: global/editorial/auth text links now expose 44 px practical targets, and topic titles rely on the root template for a single brand suffix. Narrow-screen and browser-metadata verification remain in the accessibility/E2E gate.

## Positive findings

- Responsive route layouts showed no horizontal overflow at phone, tablet, or desktop widths.
- Search handles empty, valid-reference, and invalid-reference states clearly.
- Protected `/playlist` correctly redirects an anonymous visitor to `/login`.
- Invalid API JSON returns a structured `400`; invalid selection UUID returns `404`.
- Player logic has unusually good unit coverage for ordered playback, looping, signed-URL renewal, preferences, retry states, and semantic accessibility.
- Worker tests cover restart recovery, bounded retries, canonical paths, source-hash tampering, output validation, and cleanup.
- RLS-oriented schema design, private storage, service-only editorial writes, rate limiting, and bounded selection sizes are thoughtful foundations.
- Reduced-motion handling, global focus indicators, skip navigation, labeled fields, live regions, and explicit player labels are present.

## Recommended decision

Do not deploy this state as a public beta. It is suitable for continued local UI/design review. Apply the missing topic schema, restore and drain the audio worker queue, patch vulnerable dependencies, and rerun the exact critical journeys in a preview deployment. A release should not be approved while any verified P1 remains or the signature audio journey is untested.

## Backend recheck — 22 October 2026

- Cloudflare and Google DNS resolved the project while the Mac briefly retained a negative result. The local resolver subsequently refreshed and now resolves normally.
- `npm run scripture:verify` passes the approved source hash, capability flags, exactly 31,103 public verses, known/missing passage reads, order, and duplicate removal.
- `/passage/JHN/3?verseStart=16` returns John 3:16 and the listening interface in about 1.9 seconds.
- Supabase Auth health returns HTTP 200. The `scripture-audio` bucket exists, is private, accepts only `audio/mpeg`, and has a 10 MB object limit.
- `scripture_topics` is absent from the deployed PostgREST schema (`PGRST205`).
- Audio state: 18 ready assets, 67 pending assets, 0 generating, 0 failed; 67 queued jobs, 0 processing, 0 failed. The oldest queued job was created on 3 September 2026.
- OS-001 and the outage-latency observation OS-010 are closed by this recheck. They do not clear the new schema and worker blockers.
