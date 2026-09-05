# CLAUDE.md — OneScripture

## Active Phase
**Kokoro MVP Phase 4 — Kokoro Worker**
See PHASE.md for full checklist.

---

## What This App Does
OneScripture is rebuilding around an approved canonical scripture catalogue and
reusable, self-generated verse narration. The MVP uses the public-domain World
English Bible and two approved Kokoro voices. Users will select one verse, a
range, a chapter, or several unrelated references and play the ordered selection
once or continuously.

---

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4 (CSS-first `@theme`)
- **UI Primitives:** Radix UI
- **Auth + DB:** Supabase
- **Scripture source:** Pinned World English Bible artifact from eBible.org
- **Narration:** Kokoro-82M worker (`af_heart` and `am_michael`)
- **Deployment:** Vercel

---

## Project Structure
```
/src
  /app                  # Next.js App Router pages
    /api                # Server-side selection and asset routes
    /(auth)             # Sign in / Sign up pages
    /(main)             # Main app pages (layout with nav)
  /components
    /ui                 # Reusable primitives (button, input, modal)
    /layout             # Nav, footer, page wrapper
    /player             # Audio player component
    /ad                 # AdSlot component
    /playlist           # Playlist builder and view components
  /lib
    /bible              # Canonical book/reference helpers; legacy Bible.is code
    /scripture          # Canonical catalogue and selection domain
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
  DEFAULT_TRANSLATION: 'WEB',
  DEFAULT_LANGUAGE: 'en',
  MAX_PLAYLIST_ITEMS: 50,
} as const;
```

### `/src/components/ad/AdSlot.tsx`
Renders nothing when `ADS_ENABLED=false`. Accepts a `slotId` prop.
```typescript
// slotId options: 'homepage-hero' | 'player-sidebar' | 'footer'
```

### `/src/lib/scripture/catalogue.ts`
Server-only access to canonical translations and verses through the Supabase
server client. Never load synthesis text from browser input or a third-party
audio API.

### Legacy Bible.is and download files
Bible.is client, player, and download files remain temporarily during the
rebuild. They are not the target architecture and must not be extended. Phase 8
removes them from the product flow after Kokoro playback is complete.

---

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Design Tokens
Defined in the `@theme` block in `src/app/globals.css` (Tailwind 4 CSS-first config — there is no `tailwind.config.ts`). Do not use arbitrary Tailwind values — add a token to `@theme` instead.

**Architecture:** three layers, all in `globals.css`.
1. `:root` — canonical brand colours (`--color-electric-blue`, `--color-scripture-yellow`,
   `--color-heather-purple`, `--color-electric-purple`, `--color-open-teal`,
   `--color-ink`, `--color-paper`) plus semantic state colours.
2. `[data-page-theme="…"]` — each route re-points the `--page-*` semantic layer
   (background, foreground, surface, accent, border, focus, highlight).
   `PageCanvas` sets the attribute from `pageThemes.ts`.
3. `@theme inline` — bridges `--page-*` into Tailwind utilities
   (`bg-background`, `text-text-primary`, `border-border`, `bg-surface`, …).

`.app-chrome` and `.surface-strong-context` re-scope the same `--page-*`
variables for nav/footer and dark inset surfaces.

**Scales — use the token, never an arbitrary value:**
- Radius: `rounded-control` (4px), `rounded-surface` (6px)
- Tracking: `tracking-label`, `tracking-eyebrow`, `tracking-hero`
- Fields always use `bg-field` / `text-field-foreground` so inputs keep one
  identity across every route theme. Do not re-theme them per page.

**Typography:**
- Display / scripture: `font-display` (Georgia stack). `font-serif` is aliased
  to the same stack so scripture body and headings never diverge.
- UI / body: `font-sans` (Avenir Next / system stack)

---

## Component Rules

1. **All components are TypeScript.** No `.js` or `.jsx` files.
2. **No inline styles.** Use Tailwind classes only.
3. **Prefer native elements over a UI dependency.** Radix is *not* installed.
   The scrubber, volume, and verse selection are native `input` elements and
   should stay that way; only add Radix if a real focus-management or
   portalling need appears (dialog, popover, combobox).
4. **AdSlot component is always used for ad placements.** Never hardcode ad markup directly.
5. **Canonical scripture text comes only from `scripture_verses`.** Never accept
   arbitrary synthesis text from the browser.
6. **Do not add Bible.is or public download dependencies to new work.** Legacy
   files remain only until Phase 8 removal.
7. **Supabase is always called via `/src/lib/supabase/`.** Use the server client
   in server components and API routes; use the browser client in client
   components.
8. **Keep provider, service-role, storage, and worker code server-only.**

---

## Auth Rules

- Anonymous users may browse canonical text and create rate-limited selections.
- Authentication remains available for protected preferences and future saved
  experiences; full playlist management is outside the Kokoro playback MVP.
- Protected routes: only `/playlist` and `/playlist/*` exist today. The
  `PROTECTED_PREFIXES` list in `src/lib/auth/protected.ts` also reserves
  `/dashboard`, `/history`, `/favourites`, and `/settings` so those routes are
  guarded the moment anyone adds them. Do not ship a placeholder page for a
  route that does nothing — build it when the feature is real.
- Sign-in and the OAuth callback both land on `/playlist`.
- The Supabase auth guard lives in **`src/proxy.ts`** (Next.js 16 renamed
  `middleware.ts` to `proxy.ts`; a file named `middleware.ts` silently no-ops).
- Email/password is active. Social providers remain feature-flagged until their
  provider configuration is verified.

---

## MVP Audio Behaviour

- One canonical audio asset per verse, translation, voice, model version, and
  text hash.
- Missing assets are generated by a private Kokoro worker and reused.
- The player consumes an ordered verse sequence and supports play-once and loop.
- A single **Listen** action prepares and then autoplays. Never surface
  "prepare" as a separate step the user has to understand.
- Selections are built by ticking verses in `VerseList` (Shift extends a range);
  the ticked set feeds `ScriptureAudioPlayer.references` in canonical order.
- `AudioPlayer` reports the playing reference upward so the verse list can
  highlight it (`aria-current`). Keep reading and listening in sync.
- Preparation polling is bounded (120s) and then offers a retry. Never poll
  indefinitely.
- Preferences may persist locally; audio bytes may not.
- The MVP has no visible download feature or arbitrary remote-audio proxy.

---

## Session Hygiene for Claude Code

- Always read CLAUDE.md and PHASE.md at the start of each session
- Check the active checklist in PHASE.md and continue from the first unchecked
  item in that phase.
- Do not refactor completed components unless explicitly asked
- Keep components small and focused — one responsibility per file
- After each working feature, confirm it is production-ready before moving on
