# SCREEN-FLOW.md — OneScripture

## Overview

This document maps every screen, state, and transition in the OneScripture web app. All flows are for v1 (Phase 1) unless marked [Phase 2].

---

## Screen Index

| ID | Screen Name | Auth Required |
|---|---|---|
| S01 | Homepage / Landing | No |
| S02 | Search Results | No |
| S03 | Passage View (Player) | No |
| S04 | Browse — Book List | No |
| S05 | Browse — Chapter List | No |
| S06 | Download Interstitial | No |
| S07 | Sign Up | No |
| S08 | Log In | No |
| S09 | Dashboard | Yes |
| S10 | Playlist Builder | Yes |
| S11 | Playlist View | Yes |
| S12 | Download History | Yes |
| S13 | Saved Favourites | Yes |
| S14 | Settings | Yes |

---

## S01 — Homepage / Landing

**Purpose:** First impression and primary entry point. Users should understand what the app does and begin immediately.

**Layout:**
- Full-screen hero with tagline ("Hear the Word. Download it.")
- Prominent search bar centred on screen
- Translation/language selector (dropdown) beside or below search bar
- "Browse by Book" secondary CTA below search
- Navigation: Logo | Browse | Sign In | Sign Up
- `ad-homepage-hero` slot below search (invisible in v1)

**States:**
- Default (empty search)
- Search focused (input active, suggestions dropdown appears)

**Transitions:**
- Type + Enter or click Search → S02 (Search Results)
- Click "Browse by Book" → S04 (Book List)
- Click Sign In → S08
- Click Sign Up → S07

---

## S02 — Search Results

**Purpose:** Display matching passages based on user query.

**Layout:**
- Search bar at top (pre-filled with query, editable)
- Translation/language selector
- Results list: each result shows Book, Chapter, Verse range, Translation, and a Play button
- Pagination or infinite scroll for long results

**States:**
- Loading (skeleton cards)
- Results found
- No results (friendly empty state with browse suggestion)

**Transitions:**
- Click a result → S03 (Passage View)
- Edit search query → refresh S02
- Click Browse → S04

---

## S03 — Passage View (Player)

**Purpose:** Core product screen. User listens to and downloads a passage.

**Layout:**
- Passage reference header (e.g. "John 3:16–17 · ESV")
- Scripture text displayed below header (optional, for context)
- Audio player: play/pause, scrubber, time elapsed, speed control
- Translation/language switcher (reloads audio for same passage)
- Download button (triggers S06 interstitial)
- "Add to Playlist" button (if signed in) or "Sign in to save" prompt (if anonymous)
- `ad-player-sidebar` slot (invisible in v1)
- Related passages suggestions [Phase 2]

**States:**
- Loading audio
- Playing
- Paused
- Completed
- Error (audio unavailable for this translation)

**Transitions:**
- Click Download → S06 (Download Interstitial)
- Click "Add to Playlist" (authenticated) → inline playlist selector modal
- Click "Sign in to save" → S08
- Switch translation → reload audio, stay on S03
- Browse next/previous chapter → new S03

---

## S06 — Download Interstitial

**Purpose:** Gate between player and file download. Ad slot placeholder; in v1 it is a brief confirmation screen.

**Layout (v1 — no ads):**
- "Your download is ready" message
- Passage reference and translation
- Download button (triggers actual MP3 download)
- "Back to player" link

**Layout (v1+ — ads active):**
- Same as above but with `ad-download-interstitial` slot rendered above download button
- Ad visible for ~3 seconds before download button becomes active (optional timer)

**Transitions:**
- Click Download → file download begins, user stays on screen
- Click "Back to player" → S03

---

## S04 — Browse: Book List

**Purpose:** Let users explore the Bible structure without needing to search.

**Layout:**
- Two sections: Old Testament | New Testament
- Grid or list of book names
- Each book shows number of chapters

**Transitions:**
- Click a book → S05 (Chapter List)

---

## S05 — Browse: Chapter List

**Purpose:** Select a chapter to listen to.

**Layout:**
- Book name header
- Grid of chapter numbers
- Translation selector at top

**Transitions:**
- Click a chapter → S03 (Passage View for full chapter)
- Back → S04

---

## S07 — Sign Up

**Purpose:** Create an account to unlock playlists, history, and favourites.

**Layout:**
- App logo
- "Create your account" heading
- Email + password fields
- Google OAuth button
- "Already have an account? Log in" link
- Value prop summary ("Save playlists · Download history · Favourites")

**Transitions:**
- Successful signup → S09 (Dashboard)
- Click Log In → S08

---

## S08 — Log In

**Purpose:** Authenticate existing users.

**Layout:**
- App logo
- Email + password fields
- Google OAuth button
- "Forgot password" link
- "Don't have an account? Sign up" link

**Transitions:**
- Successful login → S09 (Dashboard) or return to previous screen
- Click Sign Up → S07

---

## S09 — Dashboard

**Purpose:** Signed-in user's home base. Shows their playlists, recent downloads, and favourites.

**Layout:**
- Welcome message with user name
- "My Playlists" section (list of named playlists with passage count)
- "Recent Downloads" section (last 5–10 downloads)
- "Favourites" quick access
- "New Playlist" CTA

**Transitions:**
- Click a playlist → S11 (Playlist View)
- Click "New Playlist" → S10 (Playlist Builder)
- Click a download → S03 (Passage View)
- Click "View All Downloads" → S12
- Click "View All Favourites" → S13

---

## S10 — Playlist Builder

**Purpose:** Let signed-in users curate a named collection of scripture passages.

**Layout:**
- Playlist name input (editable)
- Search bar to find and add passages
- Passage list (draggable to reorder)
- Each passage row: reference, translation, play button, remove button
- Translation selector per passage (or global)
- "Save Playlist" CTA
- "Download All" CTA (triggers sequential download or zip)

**States:**
- Empty (no passages added yet)
- Building (passages being added)
- Saved

**Transitions:**
- Search → inline results dropdown → add to list
- Click Save → playlist saved, redirect to S11
- Click Download All → S06 interstitial per file or batch zip

---

## S11 — Playlist View

**Purpose:** View and manage a saved playlist.

**Layout:**
- Playlist name (editable inline)
- Passage list with play buttons
- "Play All" button (sequential inline playback)
- "Download All" button
- "Add More Passages" → activates search inline
- Delete playlist option

**Transitions:**
- Click a passage → S03
- Click Download All → S06 interstitial
- Click "Add More" → inline search, stay on S11
- Back → S09

---

## S12 — Download History

**Purpose:** View all previously downloaded passages.

**Layout:**
- Chronological list of downloaded passages
- Each row: reference, translation, language, date, re-download button
- Filter by translation or language

**Transitions:**
- Click passage reference → S03
- Click re-download → S06 interstitial

---

## S13 — Saved Favourites

**Purpose:** Quick access to bookmarked passages.

**Layout:**
- Grid or list of favourited passages
- Each card: reference, translation, play button, remove from favourites
- Empty state with prompt to browse

**Transitions:**
- Click a passage → S03
- Click play → S03 with player auto-started

---

## S14 — Settings

**Purpose:** Manage account preferences.

**Layout:**
- Account info (email, name)
- Default translation selector
- Default language selector
- Change password
- Delete account
- Sign out

---

## Global Navigation

| Element | Visible To | Links To |
|---|---|---|
| Logo | All | S01 |
| Browse | All | S04 |
| Search bar | All | S02 |
| Sign In | Anonymous | S08 |
| Sign Up | Anonymous | S07 |
| Dashboard | Authenticated | S09 |
| Settings | Authenticated | S14 |
| Sign Out | Authenticated | Logs out → S01 |

---

## Ad Slot Map

| Slot ID | Screen | Position | Active in v1 |
|---|---|---|---|
| `ad-homepage-hero` | S01 | Below search bar | No |
| `ad-player-sidebar` | S03 | Beside audio player | No |
| `ad-download-interstitial` | S06 | Above download button | No |
| `ad-footer` | All screens | Site footer | No |
