# OneScripture — Phase 1 Execution Roadmap (Master Design)

**Date:** 2026-08-04
**Status:** Approved (roadmap-level). Each slice gets its own brainstorm → spec → plan before implementation.
**Owner:** Nate / Inpath

This is the **master roadmap** for Phase 1. It decomposes the Phase 1 checklist
(see `PHASE.md`) into four sequenced, independently shippable slices, records the
architecture decisions made during brainstorming, and defines what "done" means
for each slice. It does not restate the product spec — see `PRD.md`, `DATA.md`,
`SCREEN-FLOW.md`, `PROMPTS.md`, and `CLAUDE.md` for the source of truth.

---

## 1. Confirmed decisions (brainstorm outcomes)

| Decision | Choice | Rationale |
|---|---|---|
| **Stack** | Next.js 14 (App Router) / TS strict / Tailwind / Radix / Supabase / Vercel | Matches all spec docs. One deployable on Vercel (frontend + API routes + middleware). SSR available for Phase 2 shareable-link OG previews. |
| **Vite + Express considered?** | Rejected | "Faster" is only dev-HMR. For this app it adds a second deployable, client-only route guards, and no SSR path for Phase 2 — more friction, not less. |
| **Cost model** | Cost driver is **audio bandwidth**, not the framework | Data layer (Supabase) stores only tiny text rows and stays cheap. Egress is the real cost and is controlled architecturally (below). |
| **Playback** | `<audio src>` points **directly at the Bible.is CDN URL** — no proxy | Highest-volume action (5,000+ plays target) costs **zero egress** on our infra. Audio elements load cross-origin without a CORS proxy. |
| **Download** | Routes through `/api/download`, which **302-redirects** to the CDN URL (with a content-disposition param if honored) | Forces a proper `filename.mp3` attachment while keeping bytes off our server. Fall back to true streaming-through-function only if the spike proves the CDN won't force the filename. |
| **CLAUDE.md rule #6** | **Amended** | Original: "Download always goes through proxy. Never link directly to CDN." Refined: *playback streams direct from CDN; downloads route through `/api/download`, which redirects when possible.* CLAUDE.md to be updated to match. |
| **Translations at launch** | Whatever the API actually serves | NIV/ESV licensing and Twi/Ga availability are unconfirmed. The spike (Slice 1) locks the real map; unavailable translations are dropped, not blocking. |
| **Bible.is API key** | User requests it now (FCBH approval can take time) | Slice 0 builds the client + runnable spike script so the live spike runs the moment the key arrives. |
| **Auth parallelism** | Slice 3 (auth/DB) runs **in parallel** during the key wait | Auth needs no Bible.is key; using the wait productively. |
| **UI production** | Built directly in code from `PROMPTS.md` + design tokens; refined in browser preview | No external design-tool step. |
| **Budget note** | Vercel Pro (~$20/mo) required — Hobby is non-commercial and ads are planned. Supabase free → Pro (~$25/mo) only when limits approached. | Pricing is from memory; verify current numbers before billing commitments. |

---

## 2. Slice decomposition & sequencing

Phase 1 is too large for one plan. It is built as four slices, each
production-ready before the next. Slice 0 starts immediately; Slice 3 runs in
parallel during the Bible.is key wait.

```
Slice 0: Foundation ──┬── Slice 1: Bible.is spike ── Slice 2: Anonymous core ──┐
     (no key needed)   │        (needs key)               (needs key)          ├── Slice 4: Auth'd features
                       └── Slice 3: Auth + persistence ───────────────────────┘        (needs 2 & 3)
                                  (no key needed, parallel)
```

| # | Slice | Screens / deliverables | Key needed? |
|---|---|---|---|
| **0** | **Foundation** | Scaffold, design tokens, layout/nav/footer, `AdSlot`, `APP_CONFIG`, typed Bible.is client, runnable spike script | No — **start now** |
| **1** | **Bible.is spike** | Run live; confirm real fileset/DAM IDs; lock translation map; verify one playable + downloadable URL per available translation | **Yes — gate** |
| **2** | **Anonymous core** | S01 Home, S02 Search, S04 Book list, S05 Chapter list, S03 Player, S06 Download interstitial | Yes |
| **3** | **Auth + persistence** | Supabase auth (email + Google), S07 Sign up, S08 Log in, `middleware.ts` protected routes, DB schema + RLS (`DATA.md`) | No — parallel |
| **4** | **Authenticated features** | S09 Dashboard, S10 Playlist builder, S11 Playlist view, S12 History, S13 Favourites, S14 Settings | Yes (needs 2 & 3) |

---

## 3. Slice detail

### Slice 0 — Foundation (start now)

- `create-next-app`: Next 14 App Router, TS strict, Tailwind; `/src` structure exactly per `CLAUDE.md`.
- `tailwind.config.ts`: exact palette + Playfair Display / DM Sans tokens. No arbitrary Tailwind values.
- `/src/config/app.ts`: `APP_CONFIG` verbatim from spec.
- `AdSlot` (`/src/components/ad/AdSlot.tsx`): renders nothing when `ADS_ENABLED=false`; typed `slotId`.
- Global layout, auth-aware nav placeholder, footer, dark theme, subtle grain texture.
- `/src/lib/bible/client.ts`: typed DBP4 wrapper — all four endpoints (bibles, books, chapter audio) typed against `DATA.md` contracts. Reference parsing + URL building are unit-tested (TDD).
- `scripts/bible-spike.ts`: documented script enumerating Bibles/filesets for `eng`, `tw`, `gaa` and verifying an audio `path` resolves. Ready to run on key arrival.
- Update `CLAUDE.md` rule #6 to the refined playback/download behavior.

**Done when:** `npm run build` is clean, the app boots to a themed homepage shell with working nav/footer, `AdSlot` renders nothing, Bible.is client unit tests pass, and the spike script is runnable (pending key).

### Slice 1 — Bible.is spike (gate)

**Done when:** we have a **confirmed translation map** — real fileset IDs for whichever of KJV/NIV/ESV/Twi/Ga the API actually serves — plus one verified playable **and** downloadable MP3 URL per available translation. Unavailable translations are dropped and noted. The map is hardcoded into config for Slice 2. Also confirms whether the CDN honors a content-disposition param (decides redirect-vs-stream for `/api/download`).

### Slice 2 — Anonymous core

The complete anonymous journey: land → search or browse → play (direct CDN) →
download (via `/api/download` redirect). `/api/download` route implemented and
tested. Anonymous downloads optionally logged (nullable `user_id`).

**Done when:** a user with no account can land, search/browse, play, and download a passage in the browser, and `npm run build` is clean.

### Slice 3 — Auth + persistence (parallel)

Supabase project, email/password + Google OAuth, `middleware.ts` protecting
`/dashboard`, `/playlist/*`, `/history`, `/favourites`, `/settings`. DB schema +
RLS exactly per `DATA.md`. Global session persistence.

**Done when:** a user can sign up, log in (both methods), sessions persist across navigation, protected routes redirect when logged out, and RLS is verified.

### Slice 4 — Authenticated features

S09–S14. Playlist create/reorder/save, playlist/batch download, download history,
favourites (with the unique constraint), settings/preferences.

**Done when:** a signed-in user can create a playlist, download it, and see history + favourites; all authenticated screens work end-to-end; `npm run build` clean; deployed on Vercel.

---

## 4. Cross-cutting standards

- **Git:** initialized; spec baseline committed. Each slice merges only when its "done when" criteria pass.
- **Testing:** TDD for logic worth testing — Bible.is client (reference parsing, URL building, error handling) and `/api/download`. UI screens verified in browser preview, not heavily unit-tested.
- **Verification before "done":** every slice ends with a real run — `npm run build` clean **and** the actual user journey working in-browser — before it's called complete. No success claims without evidence.
- **Component rules:** follow `CLAUDE.md` — all TS, no inline styles, Radix for interactive primitives, Bible.is only via the client, Supabase only via `/src/lib/supabase/`, `AdSlot` for all ad placements.

---

## 5. Phase 1 complete when

Per `PHASE.md`: a user can land/search/play/download without signing in; a
signed-in user can create and download a playlist; the app is deployed on Vercel;
and all **available** translation groups (whatever the spike confirmed) return
audio successfully.
