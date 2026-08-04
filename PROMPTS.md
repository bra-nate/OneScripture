# PROMPTS.md — OneScripture

## Purpose
Design prompts for each screen in OneScripture. Use these with Claude, v0, or any AI design tool to generate UI for each screen. All prompts assume the established design direction: dark, premium, typography-forward, gold accents.

---

## Global Design Context (include with every prompt)

> Dark premium Bible audio web app. Background: near-black (#0a0a0f). Surface cards: (#13131a). Gold accent (#c9a84c). Primary text: off-white (#f0ede8). Muted text: (#7a7a8a). Display font: Playfair Display (serif). UI font: DM Sans (sans-serif). Feels sacred but modern — not church clipart, not cold SaaS. No gradients. Subtle grain texture on backgrounds. Gold used sparingly for key actions and scripture references.

---

## S01 — Homepage / Landing

Design a full-viewport homepage for a Bible audio download web app called OneScripture. Dark near-black background with subtle grain texture. Centre of screen: the word "OneScripture" in Playfair Display, large and elegant. Below it a short tagline in DM Sans, muted: "Find it. Hear it. Keep it." Below that: a wide, minimal search bar with placeholder text "Search a verse, chapter, or book…" and a translation/language dropdown immediately beside it styled in gold outline. Below the search bar, a secondary text link: "or browse by book →". Navigation bar at top: logo left-aligned, "Browse" and "Sign In" right-aligned in DM Sans small caps. No hero image — the typography IS the hero. Reserved empty space below search bar for a future ad slot (a thin horizontal strip marked only with a faint border). Feels like a luxury editorial publication, not a utility app.

---

## S02 — Search Results

Design a search results screen for OneScripture. Top of screen: the same minimal search bar pre-filled with the user's query (e.g. "Romans 8"), with a translation dropdown beside it. Below: a clean vertical list of results. Each result is a card with: book name + chapter/verse reference in Playfair Display (gold), translation badge in a small pill (e.g. "ESV"), and a subtle play button (circle with triangle icon) on the right. Cards have a dark surface background with a thin border. Hover state: card border shifts to gold. Loading state: skeleton cards with shimmer. Empty state: centred message in muted text with a "Browse the Bible" link. No sidebar. Full-width results list with generous padding.

---

## S03 — Passage View (Player)

Design the core screen of OneScripture — the passage audio player. Dark background. Top section: passage reference in large Playfair Display (e.g. "Romans 8 : 28") with translation badge beside it ("ESV" in a gold pill). Below the reference, 2–3 lines of scripture text in Playfair Display italic, muted — just enough to give context, not the full passage. Centre of screen: a custom audio player. Play/pause button large and circular, gold fill. Below it: a full-width scrubber bar in gold. Time elapsed and total duration in DM Sans small text either side of the scrubber. Playback speed selector (0.75× 1× 1.25× 1.5×) as small text tabs below the scrubber. Below the player: two action buttons side by side — "Download" (gold filled button) and "Add to Playlist" (gold outline button). If user is not signed in, "Add to Playlist" shows as "Sign in to save" in muted text. Right side (desktop): a reserved empty vertical strip for a future ad slot, invisible for now. Feels like a premium music player but sacred.

---

## S06 — Download Interstitial

Design a minimal interstitial screen for OneScripture shown before a file downloads. Dark surface card centred on the page (modal-like, but full-screen on mobile). Top: small muted text "Your download is ready". Below: the passage reference in Playfair Display gold (e.g. "Psalm 23 · KJV"). Below that: a reserved horizontal slot for a future ad (shown as a faint dotted rectangle with the label "Ad placement" in tiny muted text — invisible to users in v1). Below the ad slot: a large gold "Download MP3" button. Below the button: a small DM Sans link "← Back to player". Minimalist. No decoration. The focus is entirely on the one action.

---

## S04 — Browse: Book List

Design a Bible book browser screen for OneScripture. Dark background. Page title "Browse the Bible" in Playfair Display. Two sections stacked: "Old Testament" and "New Testament" — each with a subtle section label in DM Sans small caps, muted. Below each label: a responsive grid of book name cards. Each card: book name in DM Sans medium weight, number of chapters in small muted text below. Card background: dark surface. Hover: gold border. Clean, no icons, no illustrations. Generous whitespace between sections. Feels like browsing a premium book catalogue.

---

## S05 — Browse: Chapter List

Design a chapter selection screen for OneScripture. Dark background. Breadcrumb at top: "Browse → Genesis" in small DM Sans muted text. Book name large in Playfair Display. Translation selector pill below the title. Main content: a tight numeric grid of chapter numbers. Each chapter number in a square tile — dark surface, white number in DM Sans. Hover: gold background, dark number. Simple, fast to scan, zero clutter.

---

## S07 — Sign Up

Design a sign-up screen for OneScripture. Centred card on dark background. App logo or wordmark "OneScripture" at top in Playfair Display. Heading: "Create your account" in DM Sans medium. Value prop in small muted text: "Save playlists · Track downloads · Bookmark favourites". Email input and password input, minimal styling — dark surface, gold focus border. Large "Create Account" gold button. Divider: "or" in muted text. Google sign-in button below (standard but styled dark with subtle border). Footer link: "Already have an account? Sign in →" in small muted text. No background decoration — the card is the focus.

---

## S08 — Log In

Design a log-in screen for OneScripture. Same card layout as sign-up. Wordmark at top. Heading: "Welcome back" in DM Sans. Email and password inputs. "Forgot password?" small link right-aligned below password. Gold "Sign In" button. Divider + Google sign-in. Footer: "Don't have an account? Sign up →". Clean. No friction. No illustration.

---

## S09 — Dashboard

Design an authenticated user dashboard for OneScripture. Dark background. Top greeting: "Good morning, [Name]" in DM Sans. Three sections below: 1) "My Playlists" — horizontal scroll row of playlist cards, each showing playlist name in Playfair Display and passage count in muted text, with a gold "+" card at the end to create new. 2) "Recent Downloads" — vertical list of last 5 downloaded passages, each row showing reference, translation badge, and date in muted text, with a re-download icon on the right. 3) "Favourites" — a compact grid of bookmarked passages, each as a small card. Section headings in DM Sans small caps. Premium but functional — like a Spotify home screen but sacred.

---

## S10 — Playlist Builder

Design a playlist builder screen for OneScripture. Two-column layout on desktop: left column is a search panel to find and add passages; right column is the growing playlist. Left: search bar at top, results appear below as compact cards with an "Add +" button. Right: editable playlist name at top (inline edit). Below: a draggable list of added passages — each row shows passage reference in Playfair Display, translation badge, a drag handle on the left, and a remove button on the right. Bottom of right column: "Save Playlist" and "Download All" buttons side by side. On mobile: stacked layout, search first. Tone: productive but premium.

---

## S11 — Playlist View

Design a saved playlist view screen for OneScripture. Playlist name large in Playfair Display. Subtitle: "[n] passages" in muted DM Sans. Two action buttons top right: "Play All" (gold outline) and "Download All" (gold filled). Below: vertical list of passages in the playlist. Each row: order number (muted), passage reference (Playfair Display, gold), translation badge, play button icon on the right. Last row: a dashed "+ Add more passages" row that activates inline search. Clean and editorial.

---

## S14 — Settings

Design a settings screen for OneScripture. Minimal. Left sidebar navigation on desktop (Account, Preferences, Security, Danger Zone) — active item highlighted in gold. Main content area: form fields for each section. Account: display name, email (read-only), profile photo (optional). Preferences: default translation dropdown, default language dropdown. Security: change password link. Danger Zone: "Delete account" in muted red, with a warning. All inputs: dark surface, gold focus border. Save button per section, gold filled. No cards — just clean form sections separated by thin borders.
