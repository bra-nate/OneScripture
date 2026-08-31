# Phase 2 — Scripture catalogue

**Completed:** 2026-08-31  
**Status:** Complete

## Approved catalogue

- Translation: World English Bible (`WEB`)
- Source ID: `engwebp`
- Source: eBible.org
- Source artifact SHA-256:
  `f08d13b4f0701108f7b9f95d57c201649f37c36359f707c8cf1876538a84d750`
- Canonical coverage: 66 books, 31,103 verse records
- Canonical range: Genesis 1:1 through Revelation 22:21
- Empty source verse markers preserved: 5

## Completed deployment

- Applied `supabase/migrations/0002_scripture_catalogue.sql` to the approved
  hosted Supabase project.
- Imported the pinned WEB VPL artifact using deterministic 500-row upserts.
- Verified the final translation and verse counts.
- Verified anonymous and authenticated roles can select both catalogue tables.
- Verified anonymous and authenticated roles cannot insert, update, or delete
  either catalogue table.
- Verified the source hash and display/generation/streaming capability flags.

## Completed behavior checks

- Single verse: John 3:16
- Verse range: John 3:16–18
- Chapter: Psalm 23
- Missing chapter: John 22
- Missing verse: John 3:999
- Ordered multi-reference selection with deterministic duplicate removal
- Browser journey: search for John 3:16 → open passage → render canonical WEB
  verse text

## Repeatable verification

Run:

```sh
npm run scripture:verify
```

The command is read-only. It verifies the hosted source pin, rights flags,
31,103 public records, passage boundary behavior, and ordered multi-reference
normalization.

## Quality gates

- `npm test`: 46 tests passed
- `npm run lint`: passed
- `npm run build -- --webpack`: passed

Phase 3 may now begin with the audio asset, job, selection, storage, and signed
URL model defined by the Kokoro MVP plan.
