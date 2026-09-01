# Phase 5 — Selection API foundation

**Started:** 2026-09-01

## First increment

- Defined the public create-selection request and deterministic response types.
- Restricted requests to the approved WEB translation and the `af_heart` and
  `am_michael` voices.
- Bounded each request to 1–20 reference expressions; canonical normalization
  continues to enforce the 200-verse ceiling.
- Added stable error codes for invalid requests, unsupported translations, and
  unsupported voices.
- Added deterministic SHA-256 selection hashing over the translation identity,
  voice, and ordered canonical verse IDs.
- Added contract tests covering normalization, limits, unsupported values,
  order sensitivity, and voice sensitivity.

## Next increment

Add the atomic database orchestration and rate-limit contract that reuses ready
assets, creates only missing jobs, and persists ordered selection items. The
public create, status, and retry Route Handlers will sit on that service layer.
