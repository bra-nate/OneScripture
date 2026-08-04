# PRD.md — OneScripture

## Product Overview

**Product Name:** OneScripture
**Type:** Web Application
**Version:** 1.0 (Phase 1)
**Owner:** Nate / Inpath
**Last Updated:** May 2026

OneScripture is a premium, design-forward web application that allows users to find any Bible passage, listen to it in high-quality audio, and download it as an audio file. It supports multiple English translations (KJV, NIV, ESV) and local African language versions (including Twi and Ga), powered by the Bible.is / Faith Comes By Hearing API.

The product is built for individual believers, globally — with a specific lean toward Ghanaian and West African users who want audio scripture in their heart language. The experience is clean, fast, and beautiful by design.

---

## Problem Statement

Most Bible apps are feature-bloated and not optimised for audio extraction. A believer who wants to download just Psalm 23 in Twi, or save Romans 8:28 to replay during their commute, has no elegant, dedicated tool to do this. OneScripture fills that gap — purpose-built for the single job of finding, playing, and downloading scripture audio.

---

## Goals

- Let any user find and play any Bible passage in seconds
- Enable audio download of single verses, passages, or chapters
- Allow signed-in users to curate and download playlists of scriptures
- Support African language audio from day one (Twi, Ga, and other Bible.is-covered languages)
- Build ad-ready layout infrastructure from the start, without activating ads until traction is achieved
- Maintain a premium, aesthetic experience that feels designed — not utilitarian

---

## Non-Goals (v1)

- Mobile native app (web only at launch)
- Social features (comments, community, following)
- User-uploaded audio
- Bible reading (text) — audio only
- Podcast or sermon content
- In-audio advertisements

---

## Target Users

| User Type | Description |
|---|---|
| Anonymous Visitor | Browses, searches, plays, and downloads single passages without signing up |
| Registered User | Signs in to unlock playlist creation, download history, and saved favourites |
| Future: Advertiser | Ministry, Christian publisher, or brand purchasing on-screen ad placements |

**Primary markets:** Global English-speaking Christians; Ghanaian and West African believers

---

## Core User Journeys

### Journey 1 — Anonymous Download
1. User lands on homepage
2. Searches for a book, chapter, or verse (e.g. "John 3:16" or "Psalms 23")
3. Selects translation/language
4. Plays the audio inline
5. Downloads the audio file
6. (Optional) Ad interstitial shown before download completes

### Journey 2 — Registered Playlist
1. User signs up or logs in
2. Searches and plays passages
3. Adds passages to a playlist
4. Names and saves the playlist
5. Downloads the playlist as a zip of audio files or individual files
6. Views download history and saved favourites in their dashboard

---

## Features

### Phase 1 (Launch)

| Feature | Description | Auth Required |
|---|---|---|
| Passage Search | Search by book, chapter, verse, or keyword | No |
| Browse by Book | Browse the full Bible structure (OT/NT → Book → Chapter) | No |
| Translation Selector | Switch between KJV, NIV, ESV, and local language versions | No |
| Inline Audio Player | Play any passage directly in the browser | No |
| Single Download | Download a passage or chapter as MP3 | No |
| Ad Slot Infrastructure | Reserved layout slots (inactive until traction achieved) | N/A |
| User Sign Up / Login | Email/password and Google OAuth via Supabase Auth | N/A |
| Playlist Creation | Curate a named list of scripture passages | Yes |
| Playlist Download | Download all passages in a playlist | Yes |
| Download History | View previously downloaded passages | Yes |
| Saved Favourites | Bookmark passages for quick access | Yes |

### Phase 2 (Post-launch)
- Ad activation and advertiser-facing booking flow
- Shareable scripture links (with preview audio)
- Daily scripture feature (sponsored slot)
- Mobile PWA optimisation
- Additional African languages

---

## Audio Source

**Provider:** Bible.is / Faith Comes By Hearing  
**API:** DBP4 (Digital Bible Platform v4)  
**Coverage:** 1,000+ languages including Twi, Ga, and major Ghanaian languages  
**Quality:** Dramatised and oral readings available  
**Licensing:** Free for non-commercial use; commercial terms available  

Translations mapped to Bible.is DAM IDs at launch:
- KJV → `ENGESV` equivalent (confirm at integration)
- NIV → confirm availability via API
- ESV → confirm availability via API
- Twi → confirm DAM ID via API explorer
- Ga → confirm DAM ID via API explorer

---

## Ad Infrastructure (Build-Ready, Not Activated)

The following ad slot types will be built into the layout from day one, rendered as empty/invisible containers until activated:

| Slot | Placement | Format |
|---|---|---|
| `ad-homepage-hero` | Below the search bar on homepage | Banner / sponsored card |
| `ad-player-sidebar` | Beside the audio player on passage view | Sidebar unit |
| `ad-download-interstitial` | Shown before download completes | Modal / overlay |
| `ad-footer` | Site-wide footer placement | Banner |

An `ADS_ENABLED` feature flag in the app config controls visibility globally. Default: `false`.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Radix UI |
| Auth + Database | Supabase |
| Audio API | Bible.is DBP4 |
| File Handling | Browser download API / server-side MP3 proxy |
| Deployment | Vercel |
| Audio Storage (playlists) | Supabase Storage or direct Bible.is stream |

---

## Design Direction

**Aesthetic:** Premium, dark, typography-forward  
**Tone:** Sacred but modern — not church-clipart, not cold tech  
**Palette:** Deep navy or near-black base; gold/amber scripture accents; soft white text  
**Typography:** Distinctive serif for scripture display; clean sans-serif for UI  
**Motion:** Subtle entrance animations; smooth player transitions  
**Ad slots:** Styled to match the aesthetic — no raw banner ugliness even when activated

---

## Success Metrics (Phase 1)

| Metric | Target (3 months post-launch) |
|---|---|
| Unique visitors | 1,000+ |
| Passages played | 5,000+ |
| Downloads completed | 2,000+ |
| Registered users | 300+ |
| Playlists created | 100+ |
| African language downloads | 20%+ of total |

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Bible.is API rate limits | Cache audio URLs; implement request throttling |
| NIV/ESV licensing restrictions | Confirm commercial terms before launch; fallback to KJV |
| Ad aesthetics degrading UX | Curate ad formats; no auto-injected third-party scripts in v1 |
| Low African language coverage | Validate Twi/Ga availability in API explorer before launch |
| Claude Code token usage | Lean CLAUDE.md; modular component structure |
