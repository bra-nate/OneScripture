# Phase 7 — Playback MVP

**Started:** 2026-09-02

**Completed:** 2026-09-03

**Status:** Complete

## First vertical slice

- Added a client-only selection service over the Phase 5 create, status, and
  retry routes without importing Node-only server contracts into the browser.
- Added explicit idle, empty, preparing, ready, partially failed, failed, and
  playback-error presentation states.
- Refactored the single-source player into ordered verse playback with current
  reference, progress, previous/next, play-once, and repeat-selection controls.
- Added female/male voice, four bounded playback speeds, and volume controls.
- Persisted preferences under the versioned
  `onescripture:playback-preferences:v1` local-storage key.
- Preloads the next ordered verse, including the first verse at the loop edge.
- Connected canonical passage and topical scripture pages to the same shared
  player while leaving their pages as Server Components.

## Browser verification

- Verified the player at 375 × 812 and 1280-pixel desktop widths with no
  horizontal overflow.
- Verified that voice, speed, and repeat preferences survive navigation and a
  page reload.
- Prepared and played a real hosted John 3:16 asset, then crossed the media-end
  boundary in repeat mode. This uncovered and fixed a single-item loop defect;
  the repaired player restarted and remained active on the following cycle.
- Started the local Kokoro worker against the hosted Supabase environment and
  observed Psalms 23 advance from 0/6 through its live preparation states to a
  ready ordered selection. Playback advanced automatically from verse 1 to
  verse 2 while preserving the selected speed and repeat mode.
- The topical route's unavailable state rendered correctly because the hosted
  editorial topics remain in `review` rather than `published`. Topic selection
  construction and client integration remain covered by automated tests.
- Signed-URL age, loop-edge renewal, refreshed selection items, next-item
  preloading, preference reloads, and long selection sequences are covered by
  deterministic automated tests rather than wall-clock waits.

## Current quality gates

```sh
npm test
npm run lint -- --no-cache
npx next build --webpack
```

- 105 tests across 21 files pass.
- ESLint and TypeScript pass.
- The Next.js 16.3 webpack production build compiles all pages and API routes.
