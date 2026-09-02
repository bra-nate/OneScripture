# Phase 5 — Selection API runbook

**Started:** 2026-09-01

**Completed:** 2026-09-02

**Status:** Complete

## Delivered

- `POST /api/audio/selections` validates bounded JSON requests, accepts only
  canonical scripture references, and restricts generation to WEB with the
  approved `af_heart` and `am_michael` voices.
- Selection normalization preserves entered order, removes duplicate canonical
  verses, and enforces the 200-verse ceiling.
- Selection identity is a deterministic SHA-256 hash of translation, voice,
  and ordered canonical verse IDs.
- Authenticated users are rate-limited by user ID. Anonymous identities are
  HMAC-hashed from proxy address and user agent, so raw network identifiers are
  not persisted.
- Migration `0006_audio_selection_api.sql` provides a service-role-only atomic
  rate-limit counter and selection transaction. It rechecks narration rights,
  reuses canonical assets, creates at most one active job for each missing
  asset, and persists ordered selection items.
- `GET /api/audio/selections/[selectionId]` refreshes deterministic readiness
  counts. It returns no playable items until the selection is fully ready, then
  signs every private MP3 in canonical order.
- `POST /api/audio/selections/[selectionId]/retry` requeues only failed jobs
  with attempts remaining, preserves the existing attempt count, and returns
  refreshed selection state.
- Authenticated selections are owner-restricted; anonymous selections depend on
  their unguessable UUID. Public clients cannot call the underlying privileged
  RPCs directly.
- Stable error responses cover invalid JSON/reference input, unsupported rights
  or voices, expired/missing selections, rate limiting, and temporary service
  failures without exposing database details.

## Hosted deployment

`supabase/migrations/0006_audio_selection_api.sql` was applied to the hosted
OneScripture project on 2026-09-01. Supabase SQL Editor returned `Success. No
rows returned`.

An anonymous-key RPC call was rejected with Postgres code `42501`, confirming
that browser clients cannot bypass the API and invoke the privileged rate-limit
or orchestration functions.

## End-to-end evidence

The actual Next.js routes, hosted Supabase project, private Storage bucket, and
durable Kokoro container were exercised together:

| Shape | Selection | Ordered result | Final state |
| --- | --- | --- | --- |
| Single verse | John 3:17 | John 3:17 | 1/1 ready |
| Verse range | John 3:16–18 | John 3:16, 17, 18 | 3/3 ready |
| Full chapter | Psalm 23 | Psalm 23:1–6 | 6/6 ready |
| Unrelated | John 3:16 + Psalm 23:1 + Romans 8:28 | Preserved request order | 3/3 ready |

- The initial 12 selection items resolved to 11 unique assets because Psalm
  23:1 was reused across two selections.
- Nine missing assets produced exactly nine active jobs with no duplicates.
- The Phase 4 worker drained those jobs at concurrency one; every status route
  then returned `200`, exact ready/total counts, canonical order, and fresh
  signed URLs.
- A ready John 3:17 request immediately returned `200` and reused its existing
  asset. Calling retry returned `retried: 0` and created no work.
- John 3:19 was deliberately failed on attempt 1. The public retry route returned
  `retried: 1`, and the worker completed the same job on attempt 2 as a 9,456 ms
  MP3.
- The hosted fixed-window limiter allowed 10 requests and rejected request 11.
- Live error checks returned `400 invalid_request`, `422 unsupported_voice`, and
  `404 selection_not_found` as designed.

## Quality gates

```sh
npm test
npm run lint -- --no-cache
npx next build --webpack
```

- 69 tests across 14 files passed.
- ESLint and TypeScript passed.
- The Next.js 16.3 webpack production build compiled all three Selection API
  routes successfully.
- Turbopack production build was also attempted, but its CSS helper process
  could not bind a local port in this execution environment. This was an
  environment restriction rather than an application compile failure; the
  webpack production build completed successfully.
