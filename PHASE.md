# PHASE.md — OneScripture

## Build Philosophy

OneScripture is built in phases. Each phase must be production-ready before the next begins. No phase is a throwaway — every screen and component built in Phase 1 carries forward.

Claude Code sessions follow this file. The active phase is always noted at the top of CLAUDE.md.

---

## Phase 1 — Core Experience (Active)

**Goal:** A working, beautiful web app where any user can find a Bible passage, play it, and download it. Playlist creation is available to signed-in users.

**Deliverables:**

### Infrastructure
- [ ] Next.js 14 project scaffolded with TypeScript and Tailwind CSS
- [ ] Supabase project created (auth + database)
- [ ] Bible.is API key obtained and environment variables configured
- [ ] Vercel deployment connected to GitHub repo
- [ ] `ADS_ENABLED` feature flag in app config (default: false)

### Auth
- [ ] Supabase Auth configured (email/password + Google OAuth)
- [ ] Sign Up screen (S07)
- [ ] Log In screen (S08)
- [ ] Auth state managed globally (session persistence)
- [ ] Protected route wrapper for authenticated screens

### Bible.is Integration
- [ ] DBP4 API client set up (typed fetch wrapper)
- [ ] Bible/translation list fetched and cached
- [ ] Book list endpoint integrated
- [ ] Chapter list endpoint integrated
- [ ] Passage/verse audio URL endpoint integrated
- [ ] Confirm availability: KJV, NIV, ESV, Twi, Ga DAM IDs

### Core Screens
- [ ] S01 — Homepage / Landing
- [ ] S02 — Search Results
- [ ] S03 — Passage View with inline audio player
- [ ] S04 — Browse: Book List
- [ ] S05 — Browse: Chapter List
- [ ] S06 — Download Interstitial (v1 — no ads)

### Authenticated Screens
- [ ] S09 — Dashboard
- [ ] S10 — Playlist Builder
- [ ] S11 — Playlist View
- [ ] S12 — Download History
- [ ] S13 — Saved Favourites
- [ ] S14 — Settings

### Database Schema
- [ ] `users` (managed by Supabase Auth)
- [ ] `playlists` (id, user_id, name, created_at)
- [ ] `playlist_items` (id, playlist_id, book, chapter, verse_start, verse_end, translation, order)
- [ ] `downloads` (id, user_id, passage_ref, translation, downloaded_at)
- [ ] `favourites` (id, user_id, passage_ref, translation, created_at)

### Ad Slot Infrastructure
- [ ] `AdSlot` component built (renders nothing when `ADS_ENABLED=false`)
- [ ] Slots placed in layout: homepage hero, player sidebar, download interstitial, footer

### Design
- [ ] Design tokens defined (colors, typography, spacing) in Tailwind config
- [ ] Global layout and navigation component
- [ ] Dark theme applied site-wide
- [ ] Audio player styled (custom, not browser default)
- [ ] Responsive layout (desktop-first, mobile-functional)

**Phase 1 Complete When:**
- A user can land, search, play, and download a passage without signing in
- A signed-in user can create a playlist and download it
- App is deployed on Vercel at production URL
- All four translation groups return audio successfully

---

## Phase 2 — Growth & Monetisation

**Goal:** Activate ad infrastructure, expand language coverage, improve shareability and discovery.

**Deliverables:**
- [ ] Ad slot activation (`ADS_ENABLED=true`)
- [ ] Advertiser-facing booking/inquiry page
- [ ] Sponsored "Scripture of the Day" feature on homepage
- [ ] Download interstitial with timed ad display
- [ ] Shareable scripture link (unique URL per passage + translation)
- [ ] Open Graph preview for shared links (passage text + app branding)
- [ ] Additional African language coverage (Ewe, Hausa, Yoruba)
- [ ] PWA manifest for mobile home screen installation
- [ ] Analytics integration (page views, play events, downloads, language usage)

---

## Phase 3 — Platform Expansion

**Goal:** Deepen engagement, explore revenue beyond ads.

**Deliverables:**
- [ ] Daily scripture email/notification (opt-in)
- [ ] Curated scripture collections ("Peace", "Faith", "Healing") — staff picks
- [ ] Ministry/church partner programme (verified badge, featured placement)
- [ ] Premium plan (no ads, extended download history, priority support)
- [ ] Native mobile app evaluation (React Native / Expo)
