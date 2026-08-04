# CLAUDE.md — OneScripture

## Active Phase
**Phase 1 — Core Experience**
See PHASE.md for full checklist.

---

## What This App Does
OneScripture is a premium web app for finding, playing, and downloading Bible audio. Users search or browse for any passage, select a translation or African language version, play it inline, and download it as an MP3. Signed-in users can create playlists and access download history and favourites.

---

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4 (CSS-first `@theme`)
- **UI Primitives:** Radix UI
- **Auth + DB:** Supabase
- **Audio API:** Bible.is DBP4 (`https://4.dbt.io/api/`)
- **Deployment:** Vercel

---

## Project Structure
```
/src
  /app                  # Next.js App Router pages
    /api                # API routes (download proxy, Bible.is wrapper)
    /(auth)             # Sign in / Sign up pages
    /(main)             # Main app pages (layout with nav)
  /components
    /ui                 # Reusable primitives (button, input, modal)
    /layout             # Nav, footer, page wrapper
    /player             # Audio player component
    /ad                 # AdSlot component
    /playlist           # Playlist builder and view components
  /lib
    /bible              # Bible.is API client (typed)
    /supabase           # Supabase client (browser + server)
    /utils              # Shared utilities
  /config
    app.ts              # Feature flags and app constants
  /types                # Global TypeScript types
```

---

## Key Files

### `/src/config/app.ts`
```typescript
export const APP_CONFIG = {
  ADS_ENABLED: false,
  DEFAULT_TRANSLATION: 'ENGESV',
  DEFAULT_LANGUAGE: 'en',
  MAX_PLAYLIST_ITEMS: 50,
  DOWNLOAD_HISTORY_LIMIT: 100,
} as const;
```

### `/src/components/ad/AdSlot.tsx`
Renders nothing when `ADS_ENABLED=false`. Accepts a `slotId` prop.
```typescript
// slotId options: 'homepage-hero' | 'player-sidebar' | 'download-interstitial' | 'footer'
```

### `/src/lib/bible/client.ts`
Typed wrapper around Bible.is DBP4 API. All Bible.is calls go through this client — never call the API directly from components.

### `/src/app/api/download/route.ts`
Download route for MP3s. Redirects to the Bible.is CDN URL (with a content-disposition param) when possible to keep bytes off our server; falls back to fetching and streaming with correct headers only if the CDN won't force the attachment filename. Playback does NOT use this route — the `<audio>` element loads the CDN URL directly.

---

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BIBLE_IS_API_KEY=
```

---

## Design Tokens
Defined in the `@theme` block in `src/app/globals.css` (Tailwind 4 CSS-first config — there is no `tailwind.config.ts`). Do not use arbitrary Tailwind values — add a token to `@theme` instead.

**Palette:**
- `background`: `#0a0a0f` (near-black)
- `surface`: `#13131a`
- `border`: `#1e1e2e`
- `accent`: `#c9a84c` (gold)
- `accent-light`: `#e8c97a`
- `text-primary`: `#f0ede8`
- `text-muted`: `#7a7a8a`

**Typography:**
- Display / scripture: `Playfair Display` (Google Fonts)
- UI / body: `DM Sans` (Google Fonts)

---

## Component Rules

1. **All components are TypeScript.** No `.js` or `.jsx` files.
2. **No inline styles.** Use Tailwind classes only.
3. **Radix UI for all interactive primitives** (dialogs, dropdowns, sliders for the audio player scrubber).
4. **AdSlot component is always used for ad placements.** Never hardcode ad markup directly.
5. **Bible.is API is always called via `/src/lib/bible/client.ts`.** Never fetch directly from components.
6. **Playback streams directly from the Bible.is CDN URL** (no proxy — zero egress). **Downloads always go through the `/api/download` route,** which redirects to the CDN when possible and only streams through the function as a fallback.
7. **Supabase is always called via `/src/lib/supabase/`.** Use server client in server components and API routes; browser client in client components.

---

## Auth Rules

- Anonymous users: can search, play, download single passages
- Authenticated users: can also create playlists, view history, save favourites
- Protected routes: `/dashboard`, `/playlist/*`, `/history`, `/favourites`, `/settings`
- Use Supabase Auth middleware in `middleware.ts` to protect these routes
- Google OAuth + email/password both supported

---

## Audio Player Behaviour

- Custom player UI — do not use browser default `<audio>` controls
- Built on top of HTML5 `<audio>` element with custom controls via Radix UI Slider
- Controls: play/pause, scrubber, current time / duration, playback speed (0.75x, 1x, 1.25x, 1.5x)
- Player persists across navigation (consider a global player context)
- Auto-play when passage view loads (after user interaction — browser policy compliant)

---

## Download Flow

1. User clicks "Download" on S03
2. Navigate to S06 (download interstitial)
3. On confirm, call `GET /api/download?url={encodedAudioUrl}&filename={filename}`
4. Server fetches audio, streams back with `Content-Disposition: attachment`
5. Log download to Supabase `downloads` table if user is authenticated

---

## Session Hygiene for Claude Code

- Always read CLAUDE.md and PHASE.md at the start of each session
- Check the Phase 1 checklist in PHASE.md and continue from the last unchecked item
- Do not refactor completed components unless explicitly asked
- Keep components small and focused — one responsibility per file
- After each working feature, confirm it is production-ready before moving on
