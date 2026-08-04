# Slice 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the OneScripture Next.js project with design tokens, global layout, the `AdSlot` component, app config, and a typed Bible.is client plus a runnable spike script — a themed, buildable shell ready for the anonymous-core slice.

**Architecture:** Next.js 16 App Router with a `/src` layout exactly per CLAUDE.md. Tailwind 4 CSS-first tokens (`@theme` in `globals.css`) replace the old `tailwind.config.ts` workflow. The Bible.is client is a pure, typed wrapper: pure URL/reference helpers are unit-tested (Vitest); network calls are thin. The spike script reuses the client and runs live once the API key arrives.

**Tech Stack:** Next.js 16, TypeScript (strict), Tailwind CSS 4, Radix UI, Vitest, `next/font` (Playfair Display + DM Sans).

## Global Constraints

- **Framework:** Next.js 16 (App Router), TypeScript strict. All source files `.ts`/`.tsx` — no `.js`/`.jsx`.
- **Styling:** Tailwind 4 only. No inline styles. No arbitrary Tailwind values — design tokens live in the `@theme` block in `src/app/globals.css`; extend that, don't inline hex/px.
- **Palette (exact):** background `#0a0a0f`, surface `#13131a`, border `#1e1e2e`, accent `#c9a84c`, accent-light `#e8c97a`, text-primary `#f0ede8`, text-muted `#7a7a8a`.
- **Typography:** Playfair Display (display/scripture), DM Sans (UI/body), via `next/font/google`.
- **Config values (verbatim):** `ADS_ENABLED: false`, `DEFAULT_TRANSLATION: 'ENGESV'`, `DEFAULT_LANGUAGE: 'en'`, `MAX_PLAYLIST_ITEMS: 50`, `DOWNLOAD_HISTORY_LIMIT: 100`.
- **AdSlot slotIds:** `'homepage-hero' | 'player-sidebar' | 'download-interstitial' | 'footer'`.
- **Bible.is:** all calls via `src/lib/bible/client.ts`. Base URL `https://4.dbt.io/api/`. API key from `BIBLE_IS_API_KEY` env, never hardcoded, never sent to the browser.
- **Audio rule (amended #6):** playback streams direct from the Bible.is CDN; downloads route through `/api/download`, which redirects when possible. (Downloads/proxy are Slice 2 — this slice only records the rule.)
- **Commits:** frequent, one per task minimum.

---

### Task 1: Scaffold Next.js into the existing repo

**Files:**
- Create: whole Next.js project (`package.json`, `src/app/*`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `src/app/globals.css`, etc.)
- Preserve: existing `*.md` spec docs, `docs/`, `.git/`

**Interfaces:**
- Produces: a buildable Next.js app rooted at the repo, `npm run dev`/`build`/`lint` scripts, `@/*` import alias → `src/*`.

- [ ] **Step 1: Scaffold into a temp dir** (create-next-app refuses a non-empty target)

```bash
TMP="$(mktemp -d)"
npx --yes create-next-app@latest "$TMP/os" \
  --typescript --tailwind --app --src-dir --eslint \
  --import-alias "@/*" --use-npm --disable-git --yes
```

- [ ] **Step 2: Merge scaffold into repo root, preserving docs + git**

```bash
# copy everything incl. dotfiles, but never the scaffold's git
rsync -a --exclude '.git' "$TMP/os/" ./
rm -rf "$TMP"
```

- [ ] **Step 3: Create the CLAUDE.md source structure** (empty dirs get a `.gitkeep`)

```bash
mkdir -p src/app/api src/components/ui src/components/layout \
  src/components/player src/components/ad src/components/playlist \
  src/lib/bible src/lib/supabase src/lib/utils src/config src/types scripts
```

- [ ] **Step 4: Verify it builds**

Run: `npm run build`
Expected: build succeeds (default starter page).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 16 + Tailwind 4 project"
```

---

### Task 2: Design tokens + fonts

**Files:**
- Modify: `src/app/globals.css` (replace Tailwind starter with `@theme` tokens + base styles)
- Modify: `src/app/layout.tsx` (wire `next/font`, apply dark base classes)

**Interfaces:**
- Produces: Tailwind utility classes `bg-background`, `bg-surface`, `border-border`, `text-accent`, `text-accent-light`, `text-primary`, `text-muted`, and font utilities `font-display`, `font-sans`. Consumed by every later component.

- [ ] **Step 1: Write `globals.css` `@theme` tokens**

```css
@import "tailwindcss";

@theme {
  --color-background: #0a0a0f;
  --color-surface: #13131a;
  --color-border: #1e1e2e;
  --color-accent: #c9a84c;
  --color-accent-light: #e8c97a;
  --color-text-primary: #f0ede8;
  --color-text-muted: #7a7a8a;

  --font-display: var(--font-playfair);
  --font-sans: var(--font-dm-sans);
}

body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Wire fonts + dark base in `layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "OneScripture",
  description: "Find it. Hear it. Keep it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify tokens resolve**

Replace `src/app/page.tsx` body with a probe:
```tsx
export default function Home() {
  return (
    <main className="p-10">
      <h1 className="font-display text-4xl text-accent">OneScripture</h1>
      <p className="font-sans text-text-muted">Find it. Hear it. Keep it.</p>
    </main>
  );
}
```
Run: `npm run dev`, open the page. Expected: gold Playfair heading, muted DM Sans subtext, near-black background.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: design tokens (Tailwind 4 @theme) and fonts"
```

---

### Task 3: App config

**Files:**
- Create: `src/config/app.ts`

**Interfaces:**
- Produces: `APP_CONFIG` (readonly) with `ADS_ENABLED`, `DEFAULT_TRANSLATION`, `DEFAULT_LANGUAGE`, `MAX_PLAYLIST_ITEMS`, `DOWNLOAD_HISTORY_LIMIT`.

- [ ] **Step 1: Write config**

```ts
export const APP_CONFIG = {
  ADS_ENABLED: false,
  DEFAULT_TRANSLATION: 'ENGESV',
  DEFAULT_LANGUAGE: 'en',
  MAX_PLAYLIST_ITEMS: 50,
  DOWNLOAD_HISTORY_LIMIT: 100,
} as const;
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: APP_CONFIG feature flags"
```

---

### Task 4: Vitest setup

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `"test": "vitest run"`, `"test:watch": "vitest"`)

**Interfaces:**
- Produces: a working `npm test` runner resolving the `@/*` alias.

- [ ] **Step 1: Install dev deps**

```bash
npm i -D vitest @vitejs/plugin-react vite-tsconfig-paths
```

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 3: Add scripts to `package.json`**

Add under `"scripts"`: `"test": "vitest run"` and `"test:watch": "vitest"`.

- [ ] **Step 4: Sanity test**

Create `src/lib/utils/smoke.test.ts`:
```ts
import { expect, test } from "vitest";
test("vitest runs", () => { expect(1 + 1).toBe(2); });
```
Run: `npm test`
Expected: 1 passing test. Then delete `smoke.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: vitest setup"
```

---

### Task 5: Bible reference parser (TDD)

**Files:**
- Create: `src/lib/bible/reference.ts`
- Test: `src/lib/bible/reference.test.ts`

**Interfaces:**
- Produces:
  - `type PassageRef = { bookId: string; chapter: number; verseStart: number | null; verseEnd: number | null }`
  - `parseReference(input: string): PassageRef | null` — parses "John 3:16", "John 3:16-17", "Psalms 23", "1 John 2" using a book-name→bookId map. Returns `null` on unrecognised book.
  - `formatDisplayRef(ref: PassageRef, translationAbbr: string): string` — e.g. `"John 3:16–17 · ESV"` (en-dash between verses, `·` before translation).

- [ ] **Step 1: Write failing tests**

```ts
import { expect, test } from "vitest";
import { parseReference, formatDisplayRef } from "@/lib/bible/reference";

test("parses book chapter verse", () => {
  expect(parseReference("John 3:16")).toEqual({ bookId: "JHN", chapter: 3, verseStart: 16, verseEnd: null });
});
test("parses verse range", () => {
  expect(parseReference("John 3:16-17")).toEqual({ bookId: "JHN", chapter: 3, verseStart: 16, verseEnd: 17 });
});
test("parses chapter only", () => {
  expect(parseReference("Psalms 23")).toEqual({ bookId: "PSA", chapter: 23, verseStart: null, verseEnd: null });
});
test("parses numbered book", () => {
  expect(parseReference("1 John 2")).toEqual({ bookId: "1JN", chapter: 2, verseStart: null, verseEnd: null });
});
test("returns null for unknown book", () => {
  expect(parseReference("Frodo 1:1")).toBeNull();
});
test("formats display ref with en-dash and translation", () => {
  expect(formatDisplayRef({ bookId: "JHN", chapter: 3, verseStart: 16, verseEnd: 17 }, "ESV")).toBe("John 3:16–17 · ESV");
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- reference`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Build a `BOOKS` table (bookId, canonical name, common aliases incl. "Psalms"→PSA). Normalise input: trim, collapse spaces, split trailing `chapter[:verse[-verse]]` with a regex like `^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$`, look the book name up case-insensitively (including a leading-number form like "1 John"). `formatDisplayRef` maps bookId→name and joins verses with `–` (en-dash). Include all 66 books in the table.

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- reference`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: Bible reference parser + display formatter"
```

---

### Task 6: Bible.is client (URL builders TDD + typed fetch)

**Files:**
- Create: `src/types/bible.ts` (API response types)
- Create: `src/lib/bible/urls.ts`
- Test: `src/lib/bible/urls.test.ts`
- Create: `src/lib/bible/client.ts`

**Interfaces:**
- Consumes: `PassageRef` (Task 5).
- Produces:
  - In `types/bible.ts`: `BibleFileset`, `BibleSummary` (`abbr`, `name`, `language`, `filesets`), `BibleBook` (`book_id`, `name`, `chapters`, `testament`), `ChapterAudio` (`book_id`, `chapter_start`, `verse_start`, `verse_end`, `path`).
  - In `urls.ts`: pure builders that take a base+key and return full URLs:
    - `biblesUrl(base, key, languageCode: string): string` → `${base}bibles?language_code=..&media=audio&key=..`
    - `booksUrl(base, key, bibleId: string): string` → `${base}bibles/books?bible_id=..&key=..`
    - `chapterAudioUrl(base, key, filesetId: string, bookId: string, chapter: number): string` → `${base}bibles/filesets/{filesetId}/{bookId}/{chapter}?key=..`
  - In `client.ts`: `bibleClient` object with `listBibles(languageCode)`, `listBooks(bibleId)`, `getChapterAudio(filesetId, bookId, chapter)` returning typed data; reads base (`https://4.dbt.io/api/`) and `BIBLE_IS_API_KEY` internally; throws on non-2xx.

- [ ] **Step 1: Write failing URL tests**

```ts
import { expect, test } from "vitest";
import { biblesUrl, booksUrl, chapterAudioUrl } from "@/lib/bible/urls";

const B = "https://4.dbt.io/api/";
test("bibles url", () => {
  expect(biblesUrl(B, "K", "eng")).toBe("https://4.dbt.io/api/bibles?language_code=eng&media=audio&key=K");
});
test("books url", () => {
  expect(booksUrl(B, "K", "ENGESV")).toBe("https://4.dbt.io/api/bibles/books?bible_id=ENGESV&key=K");
});
test("chapter audio url", () => {
  expect(chapterAudioUrl(B, "K", "ENGESVN2DA", "JHN", 3)).toBe("https://4.dbt.io/api/bibles/filesets/ENGESVN2DA/JHN/3?key=K");
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- urls`
Expected: FAIL.

- [ ] **Step 3: Implement `urls.ts` and `types/bible.ts`**

Pure string builders exactly matching the assertions; types mirror the `DATA.md` response shapes.

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- urls`
Expected: PASS.

- [ ] **Step 5: Implement `client.ts`**

```ts
import { biblesUrl, booksUrl, chapterAudioUrl } from "@/lib/bible/urls";
import type { BibleSummary, BibleBook, ChapterAudio } from "@/types/bible";

const BASE = "https://4.dbt.io/api/";
function key(): string {
  const k = process.env.BIBLE_IS_API_KEY;
  if (!k) throw new Error("BIBLE_IS_API_KEY is not set");
  return k;
}
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Bible.is ${res.status}: ${url}`);
  const body = (await res.json()) as { data: T };
  return body.data;
}
export const bibleClient = {
  listBibles: (languageCode: string) => getJson<BibleSummary[]>(biblesUrl(BASE, key(), languageCode)),
  listBooks: (bibleId: string) => getJson<BibleBook[]>(booksUrl(BASE, key(), bibleId)),
  getChapterAudio: (filesetId: string, bookId: string, chapter: number) =>
    getJson<ChapterAudio[]>(chapterAudioUrl(BASE, key(), filesetId, bookId, chapter)),
};
```

- [ ] **Step 6: Typecheck + commit**

Run: `npx tsc --noEmit` (expect no errors).
```bash
git add -A && git commit -m "feat: typed Bible.is DBP4 client + URL builders"
```

---

### Task 7: AdSlot component (TDD)

**Files:**
- Create: `src/components/ad/AdSlot.tsx`
- Test: `src/components/ad/AdSlot.test.tsx`

**Interfaces:**
- Consumes: `APP_CONFIG.ADS_ENABLED` (Task 3).
- Produces: `<AdSlot slotId="homepage-hero" />` — a client component that renders `null` when `ADS_ENABLED` is false; otherwise a styled placeholder container carrying `data-slot-id`. `slotId: 'homepage-hero' | 'player-sidebar' | 'download-interstitial' | 'footer'`.

- [ ] **Step 1: Add jsdom test env for component tests**

```bash
npm i -D @testing-library/react @testing-library/dom jsdom
```
Update `vitest.config.ts` `test.environment` to `"jsdom"` and broaden `include` to `["src/**/*.test.ts", "src/**/*.test.tsx"]`.

- [ ] **Step 2: Write failing test**

```tsx
import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { AdSlot } from "@/components/ad/AdSlot";

test("renders nothing when ads disabled", () => {
  // APP_CONFIG.ADS_ENABLED is false by default
  const { container } = render(<AdSlot slotId="footer" />);
  expect(container.firstChild).toBeNull();
});
```

- [ ] **Step 3: Run, verify fail**

Run: `npm test -- AdSlot`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement**

```tsx
import { APP_CONFIG } from "@/config/app";

export type AdSlotId = "homepage-hero" | "player-sidebar" | "download-interstitial" | "footer";

export function AdSlot({ slotId }: { slotId: AdSlotId }) {
  if (!APP_CONFIG.ADS_ENABLED) return null;
  return <div data-slot-id={slotId} className="rounded-md border border-border bg-surface" />;
}
```

- [ ] **Step 5: Run, verify pass**

Run: `npm test -- AdSlot`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: AdSlot component (renders nothing when ADS_ENABLED=false)"
```

---

### Task 8: Global layout — nav + footer

**Files:**
- Create: `src/components/layout/Nav.tsx`
- Create: `src/components/layout/Footer.tsx`
- Modify: `src/app/layout.tsx` (compose Nav + children + Footer)

**Interfaces:**
- Consumes: `AdSlot` (Task 7).
- Produces: site chrome present on every route. Nav: wordmark link → `/`, "Browse" → `/browse`, "Sign In" → `/login`, "Sign Up" → `/signup` (routes are placeholders this slice). Footer renders `<AdSlot slotId="footer" />` and a copyright line.

- [ ] **Step 1: Write `Nav.tsx`**

```tsx
import Link from "next/link";

export function Nav() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <Link href="/" className="font-display text-xl text-text-primary">OneScripture</Link>
      <nav className="flex items-center gap-6 font-sans text-sm uppercase tracking-wide text-text-muted">
        <Link href="/browse" className="hover:text-accent">Browse</Link>
        <Link href="/login" className="hover:text-accent">Sign In</Link>
        <Link href="/signup" className="text-accent hover:text-accent-light">Sign Up</Link>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Write `Footer.tsx`**

```tsx
import { AdSlot } from "@/components/ad/AdSlot";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border px-6 py-8">
      <AdSlot slotId="footer" />
      <p className="font-sans text-xs text-text-muted">© OneScripture. Find it. Hear it. Keep it.</p>
    </footer>
  );
}
```

- [ ] **Step 3: Compose in `layout.tsx`**

Wrap children: `<body>` becomes a flex column — `<Nav />`, `<main className="flex-1">{children}</main>`, `<Footer />`. Keep the existing font-variable classes on `<html>` and the `min-h-screen bg-background` on `<body>`; add `flex flex-col`.

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`. Expected: nav bar with gold wordmark + links, footer with copyright, no ad box (ads disabled), dark theme throughout.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: global nav + footer layout"
```

---

### Task 9: Bible.is spike script

**Files:**
- Create: `scripts/bible-spike.ts`
- Modify: `package.json` (add `"spike": "tsx --env-file-if-exists=.env.local scripts/bible-spike.ts"` — `tsx` resolves the `@/*` alias; `-if-exists` avoids a hard failure when `.env.local` is absent so the script's own key check surfaces)
- Create: `.env.local.example` (documents `BIBLE_IS_API_KEY=`)

**Interfaces:**
- Consumes: `bibleClient` (Task 6).
- Produces: a runnable script that, for language codes `eng`, `tw`, `gaa`, lists audio Bibles + fileset IDs and, for each, attempts `getChapterAudio(fileset, "JHN", 3)`, printing whether an audio `path` resolved. Output is the raw material for Slice 1's confirmed translation map.

- [ ] **Step 1: Write the script**

```ts
import { bibleClient } from "@/lib/bible/client";

const LANGS = ["eng", "tw", "gaa"];

async function main() {
  for (const lang of LANGS) {
    console.log(`\n=== ${lang} ===`);
    try {
      const bibles = await bibleClient.listBibles(lang);
      for (const b of bibles) {
        const filesets = Object.values(b.filesets ?? {}).flat();
        console.log(`${b.abbr} — ${b.name} — filesets: ${filesets.map((f) => `${f.id}(${f.type})`).join(", ")}`);
        const audio = filesets.find((f) => f.type?.startsWith("audio"));
        if (audio) {
          try {
            const chapters = await bibleClient.getChapterAudio(audio.id, "JHN", 3);
            console.log(`  ↳ JHN 3 path: ${chapters[0]?.path ?? "NONE"}`);
          } catch (e) {
            console.log(`  ↳ JHN 3 error: ${(e as Error).message}`);
          }
        }
      }
    } catch (e) {
      console.log(`listBibles error: ${(e as Error).message}`);
    }
  }
}

main();
```
> Note: `client.ts` uses the `@/*` alias — running via `node` needs alias resolution. If `node --env-file` can't resolve `@/`, run with `npx tsx scripts/bible-spike.ts` (add `tsx` as a dev dep) which honours `tsconfig` paths. Update the `spike` script to `"tsx --env-file=.env.local scripts/bible-spike.ts"` in that case.

- [ ] **Step 2: Write `.env.local.example`**

```
BIBLE_IS_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 3: Confirm it fails cleanly without a key**

Run: `npm run spike` (no `.env.local`)
Expected: throws `BIBLE_IS_API_KEY is not set` — proves wiring is correct; live run deferred to Slice 1.

- [ ] **Step 4: Ensure `.env.local` is gitignored**

Confirm `.gitignore` (from create-next-app) includes `.env*`. If not, add `.env.local`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: Bible.is spike script (runs live on key arrival)"
```

---

### Task 10: Update CLAUDE.md rule #6 + verify slice

**Files:**
- Modify: `CLAUDE.md` (Component Rules #6)

**Interfaces:**
- Produces: docs consistent with the approved cost architecture.

- [ ] **Step 1: Amend rule #6**

Replace: *"Download always goes through `/api/download` proxy. Never link directly to Bible.is CDN URLs."*
With: *"Playback streams directly from the Bible.is CDN URL (no proxy — zero egress). Downloads always go through the `/api/download` route, which redirects to the CDN when possible and only streams through the function as a fallback."*

- [ ] **Step 2: Full slice verification**

Run: `npm run build` → clean. `npm test` → all green. `npm run lint` → clean. `npm run dev` → themed home with nav/footer, no ad box.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "docs: amend CLAUDE.md rule #6 for direct-CDN playback"
```

---

## Self-Review

**Spec coverage (Slice 0 scope from roadmap §3):** scaffold ✓ (T1), Tailwind 4 tokens ✓ (T2), `APP_CONFIG` verbatim ✓ (T3), `AdSlot` ✓ (T7), layout/nav/footer/dark theme ✓ (T2, T8), typed Bible.is client with 4 endpoints ✓ (T6), reference parsing unit-tested ✓ (T5), spike script ✓ (T9), CLAUDE.md #6 amended ✓ (T10). Grain texture is deferred to the anonymous-core slice's homepage polish (cosmetic, not foundational) — noted so it isn't lost.

**Placeholder scan:** no TBD/TODO; every code step has real content. The one conditional (tsx fallback in T9) is explicit with the exact alternative command.

**Type consistency:** `PassageRef` (T5) consumed nowhere breaking; `bibleClient` method names (`listBibles`/`listBooks`/`getChapterAudio`) used identically in T9; `AdSlotId` union identical in T7 and consumed in T8; token class names match the `@theme` variables in T2.

**Done-when (roadmap):** `npm run build` clean + themed shell + AdSlot renders nothing + Bible.is client tests pass + spike runnable — all covered by T10 Step 2.
