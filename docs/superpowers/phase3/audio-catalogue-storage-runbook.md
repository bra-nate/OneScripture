# Phase 3 — Audio catalogue and storage

**Completed:** 2026-08-31  
**Status:** Complete

## Deployed catalogue

- Applied `supabase/migrations/0003_audio_catalogue.sql` to the approved hosted
  Supabase project.
- Added `audio_verse_assets`, `audio_generation_jobs`, `audio_selections`, and
  `audio_selection_items`.
- Added identity and ordering constraints, status validation, ready/failed state
  invariants, worker-claim indexes, foreign keys, and expiry indexes.
- Enabled RLS on all four tables, revoked access from `public`, `anon`, and
  `authenticated`, and granted metadata access only to `service_role`.
- Confirmed the hosted anonymous role receives PostgreSQL permission-denied
  responses for all four metadata tables.

## Private object storage

- Bucket: `scripture-audio`
- Access: private
- Maximum object size: 10 MiB
- Allowed MIME type: `audio/mpeg`
- Canonical object layout:
  `{translation}/{model-version}/{voice}/{book}/{chapter}/{verse}.mp3`

The bucket is configured through the Supabase Storage API. Application code
never writes directly to the storage schema. Playback uses short-lived signed
URLs rather than public objects.

## Hosted proof asset

- Verse: World English Bible, John 3:16
- Voice: `af_heart`
- Model: `hexgrad/Kokoro-82M`
- Model version: `kokoro-82m-v1.0-f3ff357`
- Asset ID: `e68c5a43-9024-4e71-a19e-432f91e322a0`
- Object path:
  `WEB/kokoro-82m-v1.0-f3ff357/af_heart/JHN/003/016.mp3`
- Bytes: 69,165
- Duration: 8,550 ms
- Catalogue status: `ready`

The hosted check confirmed the signed URL returned the complete MP3 with
`audio/mpeg`, and `Range: bytes=0-1023` returned HTTP 206, exactly 1,024 bytes,
and the expected `Content-Range` header.

## Server-side services

- `src/lib/audio/paths.ts` validates and creates deterministic object paths.
- `src/lib/audio/assets.ts` finds, creates, and completes reusable verse assets.
- `src/lib/audio/storage.ts` configures the private bucket, uploads MP3 assets,
  and creates bounded-expiry signed URLs.
- `src/lib/supabase/admin.ts` creates a non-persistent service-role client.

All credentialed application services import `server-only`. The standalone
verification command connects directly so the marker remains effective in the
Next.js module graph.

## Repeatable verification

Run:

```sh
npm run audio:verify-storage
```

The command uses the accepted Phase 0 John 3:16 proof MP3. It safely reuses the
same metadata identity and overwrites the same canonical object, then checks the
private bucket configuration, metadata, signed download, and byte-range seeking.

## Quality gates

- `npm test`: 53 tests passed
- `npm run lint`: passed
- `npm run build -- --webpack`: passed
- Hosted migration: passed
- Hosted anonymous metadata access denial: passed for all four tables
- Private upload, signed playback, and range-seeking proof: passed

Phase 4 may now begin with the durable Kokoro worker described in the active MVP
plan.
