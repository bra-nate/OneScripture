# Scripture Reel — Design

Status: draft for approval · 2026-10-28

## Intent

Replace the boxed audio player with a full-screen **reel**: one scripture fills
the screen while its narration plays, then the reel moves on to the next one,
the way an Instagram reel advances. You read along as you listen.

The big difference from Instagram is **sound never stops because of the
phone**. Locking the screen or switching to another app keeps the narration
going, through a whole looping queue, for as long as the user wants. Long,
uninterrupted listening on a loop was the original idea behind the app, and
the reel is meant to make that experience feel natural on a phone.

## Goals

1. Pressing **Listen** on a queue of scriptures opens a full-screen reel, with
   one verse per screen and its audio playing.
2. When a verse's audio ends, the reel advances to the next verse by itself.
3. **Swiping** up or down to another verse jumps the audio to that verse
   immediately.
4. **Loop** mode cycles from the last verse back to the first, indefinitely.
   **Play once** stops after the last verse.
5. Audio keeps playing with the **screen off** and with **another app in
   front**, including auto-advancing between verses and looping. The phone's
   lock screen and notification area show the current verse with
   play/pause, next and previous controls.
6. Two reel **styles**, chosen by the user:
   - **Quiet page:** cream paper, one large serif verse, the same look for every
     verse. This is the default.
   - **Colour per verse:** each verse gets its own full-screen brand colour,
     cycling through the palette.
7. **Audio settings on the reel:** a settings button opens a panel over the
   reel with voice, speed, volume, play-once/loop and style. Changes apply
   immediately.
8. A **Settings page** at `/settings`, open to everyone (no sign-in), with the
   same listening choices. All choices are saved on the device and shared
   between the reel panel and the Settings page.

## Non-goals (this version)

- **Read-along** (words lighting up as they're spoken). This is a planned
  follow-up and a separate project. It needs the Kokoro worker to record word
  timings, storage for them, and re-processing of already-narrated verses.
  Nothing in this version should block it. The style setting must accept a
  third value later without restructuring.
- Saving settings to the user's account or syncing them across devices.
- Likes, comments, sharing, or any social layer.
- Background images, video, or music behind verses.
- Downloading audio for offline use. Audio stays in memory for the session
  only, as CLAUDE.md requires: "audio bytes may not" persist.

## Anti-goals — failure even if it technically works

- **Audio stops or stalls when the screen locks or the user switches apps.**
  This is the headline promise. If it fails on a current iPhone (Safari) or
  Android (Chrome), the feature isn't done.
- The reel shows a verse that doesn't match what's being heard, either after
  a swipe or after coming back to the app.
- Users have to understand a separate "prepare" step. The single **Listen**
  action rule from CLAUDE.md still holds.
- Verse text is hard to read: low contrast on a colour, too small, or clipped
  for long verses.

## Current state the design builds on

- `ScriptureAudioPlayer` → `useAudioSelection` creates a selection, polls
  until it's ready (bounded at 120s, with retry), and hands ordered items to
  `AudioPlayer`. Each item is `{ id, position, reference, url }`, with no verse
  text.
- `AudioPlayer` drives a single `<audio>` element through the queue. It
  handles play-once/loop and renews signed URLs.
- **In-memory audio cache (just built, uncommitted):**
  `src/components/player/verseAudioCache.ts`. The whole queue downloads once
  per session and plays from `blob:` URLs. Once everything is cached, URL
  renewal is skipped. This is what lets a long loop run with the screen off
  and no network. It must be committed before or as part of this work.
- Preferences (`mode`, `speed`, `voiceId`, `volume`) are stored in
  localStorage under `onescripture:playback-preferences:v1` via
  `usePlaybackPreferences`.
- The player is used in **three places**:
  - the passage page (`ChapterReader`, with verse ticking and "Listen to whole
    passage")
  - the playlist detail page
  - the topic page (`TopicPlaybackPreview`)
- `/settings` is listed in `PROTECTED_PREFIXES` (`src/lib/auth/protected.ts`),
  which means sign-in only.

## Decisions

### Made by the user

- The reel replaces the boxed player as the way scriptures are played.
- Swiping jumps the audio to the swiped-to verse.
- Ship **Quiet page** and **Colour per verse** first; **Read-along** comes
  later.
- A real **Settings page**, open to everyone, saved on the device.
- Audio settings are **also available on the reel page**.

### Made by Claude (open to correction)

- **The reel is a full-screen overlay on the page that opened it, not a
  separate route.** The queue, selection and highlighted verse already live
  on that page. Closing the reel returns you exactly where you were, and the
  verse list highlights the last verse that played.
- **All three entry points open the reel:** passage, playlist and topic. The
  boxed player is removed rather than kept alongside.
- **Closing the reel stops the audio.** Locking the screen or switching apps
  does not.
- **The Android/browser Back button closes the reel** rather than leaving the
  page.
- **On a laptop**, up/down arrow keys and on-screen next/previous buttons do
  what swiping does.
- **Preparation happens inside the reel.** After **Listen**, the reel opens
  immediately, showing the existing "N of M verses ready" progress, and starts
  playing on its own.
- **Changing voice mid-listen re-prepares the queue in the new voice**, which
  matches today's behaviour. The reel stays on the current verse where
  possible.
- **Default style: Quiet page.**
- **Colour per verse** cycles through the brand pop colours (fresh-grass,
  sky-pop, coral-pop, sunshine-pop) in a fixed order. Text uses ink, and every
  pairing must meet WCAG AA contrast for large text.
- **Settings page contents:** style, voice, speed, volume, and default
  play-once/loop. A "Settings" link is added to the main navigation for
  everyone.
- **Verse text comes from the server**, not the browser: the selection
  response gains each item's canonical text from `scripture_verses`
  (CLAUDE.md rule 5). The page's own verse list must not be the source,
  because playlists and topics don't have one.
- **The style preference is stored with the other playback preferences.**
  Saved values from before this change must still load, defaulting style to
  Quiet page.

## Constraints

- Follow CLAUDE.md:
  - Tailwind tokens only, with no arbitrary values or inline styles. The
    colour sequence and any new sizes become `@theme` tokens.
  - Native elements over UI dependencies. Swiping should use native scroll
    snapping, not a carousel library.
  - TypeScript and small, single-purpose components.
- Respect `prefers-reduced-motion`: no animated slide between verses, just a
  cut.
- Accessibility:
  - The reel behaves as a modal dialog: focus moves in, is trapped, and
    returns on close.
  - The current verse is announced to screen readers when it changes.
  - All controls are reachable by keyboard.
- Lock-screen controls use the browser's Media Session API. No native app
  wrapper.
- iPhones ignore page-controlled volume (hardware buttons only). The volume
  setting should be hidden or explained on iOS rather than appear broken.
- Polling stays bounded (120s), and the existing retry behaviour is kept.

## Risks the builder should plan around

- **Background playback on iPhone** is the riskiest part. Auto-advancing to
  the next verse while the screen is locked works only if the *same* audio
  element keeps playing. Never create a new audio element per verse. A
  verse whose download hadn't finished before the screen locked falls back to
  streaming, which may fail if the signed URL has expired in the background.
  This has to be tested on a real iPhone and a real Android phone, not just
  in a desktop browser.
- **Swiping and auto-advance both move the reel.** A user swipe and an
  audio-ended advance must never fight. Whichever happens last wins, and the
  screen and the audio always agree.
- **Long verses** (for example Esther 8:9) must fit or scroll within their
  screen without breaking the snap-to-verse behaviour.

## Left to the builder

- Component breakdown and file layout under `src/components/player/` (or a new
  `src/components/reel/`).
- The exact visual treatment of the progress bars, the peek of the next
  verse, and the settings panel. Follow the approved mockups
  (`.superpowers/brainstorm/…/reel-look.html`) and the design system.
- How the selection response is extended to include verse text (RPC change
  or a separate server lookup), as long as it stays server-side and
  canonical.
- Test strategy. Background playback and lock-screen controls need a written
  manual test checklist for real devices, in addition to automated tests.

## Housekeeping this work requires

- Remove `/settings` from `PROTECTED_PREFIXES`, and update CLAUDE.md's Auth
  Rules and MVP Audio Behaviour to describe the reel, the Settings page, and
  the in-memory audio cache.
- Add `.superpowers/` to `.gitignore`.
