# Test Execution Log

**Environment:** macOS local workspace, Node 25.3.0, Next.js 16.3.0, current uncommitted redesign working tree
**Audit window:** 22 October 2026, approximately 21:11–21:22 GMT
**Data policy:** No production mutations, accounts, emails, uploads, migrations, or dependency changes were performed.

| Check | Result | Observed evidence |
| --- | --- | --- |
| `npm test` | **PASS** | 24 files, 111 tests passed. Vite emitted migration/config warnings only. |
| `npm run lint` | **PASS** | ESLint exited 0 with no findings. |
| `npm run worker:test` | **PASS** | 11 tests passed; restart/requeue, retries, hash tampering, MP3 validation, path safety, and cleanup covered. |
| `npm run topics:validate` | **PASS** | 8 topics and 40 passages validated; dry run only. Initial sandbox IPC attempt failed and was rerun outside the sandbox. |
| `npx next build --webpack` | **PASS** | Next.js production build, TypeScript, static generation, and 15-route manifest completed. Initial sandbox attempt could not resolve Google Fonts; network-enabled rerun passed. |
| `npm run scripture:verify` | **FAIL** | `WEB translation is unavailable: TypeError: fetch failed`. |
| DNS check of configured public Supabase hostname | **FAIL** | Resolver returned `NXDOMAIN`. No secret keys were printed. |
| `npm run release:health` | **BLOCKED/CRITICAL** | Exit 2: `ONESCRIPTURE_APP_URL is required`; deeper checks could not provide a valid production report. |
| `npm audit --omit=dev` | **FAIL** | 3 production vulnerability groups: 1 critical, 2 high (`next`, `sharp`, `source-map-js`). No fixes applied. |
| Local route HTTP smoke | **PARTIAL PASS** | `/`, browse, search, passage fallback, topics fallback, login, signup returned 200; `/playlist` returned 307 to `/login`; unknown route and invalid UUID returned 404; invalid JSON returned structured 400. |
| Mobile browser smoke at 375 × 812 override (360 CSS px content width) | **PARTIAL PASS** | 11 routes, no horizontal overflow; valid/invalid search and protected redirect worked; passage/topics unavailable. |
| Tablet browser smoke at 768 × 1024 | **PARTIAL PASS** | Home, browse, login, passage fallback had no horizontal overflow. |
| Desktop browser smoke at 1440 × 900 | **PARTIAL PASS** | Home, browse, login, passage fallback had no horizontal overflow. |
| Computed text contrast scan | **FAIL** | Auth “Sign up/in” link measured about 1.79:1 green-on-white; sampled home/browse/topics/passage text pairs had no detected failures. |
| Route response timing during outage | **FAIL SLO candidate** | Passage and topics took approximately 7.14 s and 7.11 s total; home/browse/login were under 0.3 s in the same sample. |

## Browser cases observed

| Route/case | Expected | Actual |
| --- | --- | --- |
| `/search` empty | Teach accepted reference syntax | PASS |
| `/search?q=John%203%3A16` | Best-match result | PASS |
| `/search?q=peace` | Explain keyword search is unsupported | PASS |
| `/browse` → `/browse/JHN` | Book and chapter selection | PASS |
| `/passage/JHN/3?verseStart=16` | Canonical text and player | Recheck PASS for text/player shell; live audio NOT RUN |
| `/topics` | Published topic directory | FAIL: unavailable fallback |
| `/playlist` logged out | Redirect to login | PASS |
| `/does-not-exist` | Helpful 404 | PASS |
| Invalid selection JSON | Structured 400 | PASS |

## Checks not run

- Signup, confirmation email, login, logout, password reset, OAuth, and expired-session behavior with real test identities.
- Live RLS isolation between two test users.
- Successful playlist create/add/remove/play persistence.
- Live selection creation, polling, retry, asset reuse, worker synthesis, private signed playback, and range seeking.
- Production domain, TLS, redirect URLs, headers, telemetry, alert webhook, queue/disk/storage health, backup retention, and restore against the intended release environment.
- Physical iOS/Android device and assistive-technology screen-reader sessions.

## Evidence limitations

- Historical phase documents describe successful hosted tests, but current results supersede them for release readiness.
- The in-app browser had to reach the development server through its LAN address. Next.js blocked cross-origin development chunks/HMR for that origin, so those browser checks are valid for server-rendered content, layout, route outcomes, overflow, and computed CSS—not as proof of hydrated client interactions. Client behavior is supported only by the automated component tests until a same-origin preview/E2E run is available.
- The current audit did not modify or repair the backend, install tools, or create external accounts.
- Automated contrast evaluation sampled visible leaf text against the nearest opaque background; it is not a substitute for a full axe/manual accessibility session on the working player.

## Backend recheck — 22 October 2026

| Check | Result | Observed evidence |
| --- | --- | --- |
| Public DNS via Cloudflare/Google | **PASS** | Both resolved the configured Supabase hostname; local DNS subsequently refreshed and also resolved. |
| `npm run scripture:verify` | **PASS** | Approved rights/source hash, 31,103 verses, known/missing passage reads, order, and duplicate removal all passed. |
| Direct Auth health | **PASS** | HTTP 200; GoTrue v2.197.0. |
| Private audio bucket | **PASS** | Bucket exists, `public: false`, `audio/mpeg` only, 10 MB object limit. |
| App passage smoke | **PASS for text** | John 3:16 returned HTTP 200 with canonical text and listening interface in ~1.9 s. |
| Topics schema | **FAIL** | PostgREST `PGRST205`: `public.scripture_topics` is not present in the schema cache. |
| Audio worker/queue state | **FAIL** | 67 queued/pending, 0 processing/generating, 0 failed, 18 ready; oldest queued job is from 3 September 2026. |
| Canonical release-health command | **NOT RERUN** | It can send webhook alerts on non-OK state. The recheck remained side-effect-free; its missing `ONESCRIPTURE_APP_URL` finding stays open. |

## Fix execution — 22 October 2026

| Check/change | Result | Observed evidence |
| --- | --- | --- |
| Hosted preflight | **BLOCKED SAFELY** | Target ref `fjtruktclyrbkzyjmvqy` is not visible to the signed-in Supabase CLI account, so provider backup retention and rollback could not be verified. No hosted migration or worker mutation was attempted. |
| Dependency remediation | **PASS** | Next.js and ESLint config 16.4.2; Sharp 0.35.5; `source-map-js` 1.2.2. `npm audit --omit=dev` reports zero vulnerabilities. |
| Password recovery implementation | **PASS locally** | Added `/forgot-password`, `/update-password`, server actions, fixed internal callback destination, account-neutral request copy, invalid-session handling, and reset-success feedback. Hosted email/redirect acceptance remains open. |
| `npm test` | **PASS** | 25 files, 112 tests passed. |
| `npm run lint` / `npx tsc --noEmit` | **PASS** | Both exited 0. |
| `npm run worker:test` | **PASS** | 11 tests passed. |
| `npm run topics:validate` | **PASS** | 8 topics and 40 passages validated; dry run only. |
| `npx next build --webpack` | **PASS** | Next.js 16.4.2 compiled 17 routes, including both recovery pages. |
| Typed catalogue recovery | **PASS locally** | Supabase/PostgREST failures now map to timeout, configuration/schema, permission, or general availability states; missing/invalid references remain distinct. Passage/topic fallbacks retry the same route without dropping URL state. |
| `npm test` after catalogue recovery | **PASS** | 27 files, 118 tests passed, including error classification, non-sensitive presentation, and current-route retry. |
| Lint, typecheck, and production build after catalogue recovery | **PASS** | ESLint and TypeScript exited 0; Next.js 16.4.2 compiled all 17 routes. Healthy local HTTP smoke returned 200 for John 3:16, topics, and a topic detail. |
| Playlist integrity and accessibility fixes | **PASS locally** | Playlist service failures now remain distinct from empty/missing data; failed deletes do not revalidate, duplicate adds are rejected, positions remain monotonic, and successful deletes confirm the update. Browser measurements found the updated global/editorial text links at 44 px high, and `/topics` rendered `Topical Scriptures · OneScripture` with one brand suffix. |
| Full regression after product fixes | **PASS** | 29 files and 122 tests passed; ESLint, TypeScript, diff checks, and the Next.js 16.4.2 production build passed. Hosted two-user RLS and route-level accessibility/browser metadata verification remain open. |

## Hosted POC execution — 12 November 2026

| Check/change | Result | Observed evidence |
| --- | --- | --- |
| Final local regression | **PASS** | 30 files and 127 frontend tests, 11 worker tests, ESLint, TypeScript, topic validation, diff checks, Next.js 16.4.2 production build, and `npm audit --omit=dev` all passed. |
| Vercel deployment | **PASS** | Isolated project deployed and aliased to `https://onescripture-poc.vercel.app`; final deployment `dpl_9iN1Fe38sPsV8dv7tMNq8ywV14uk` reached Ready. |
| Anonymous route smoke | **PASS for available data** | Home, browse, book, search, John 3, login, and recovery routes returned HTTP 200; John 3 rendered canonical text and the hydrated listening UI. |
| Hosted topics | **BLOCKED** | `/topics` renders the intended recoverable configuration state because migration 0005 is still absent from the configured Supabase project. |
| Hosted audio | **BLOCKED** | Selection UI works, then renders “Audio preparation paused” because the Vercel server-only service credential was not exported without explicit approval. Separately, the oldest queued job is about 70 days old and no worker is processing jobs. |
| Login and playlist journey | **PARTIAL PASS** | A disposable confirmed user signed in, created `POC Journey`, added John 3:16, saw persistence after navigation, and received the duplicate rejection. The account and cascading playlist data were removed afterward. Remove-button and playlist-audio browser checks remain open. |
| Two-user playlist isolation | **PASS** | Disposable users proved cross-user playlist reads and updates return no rows and a foreign playlist-item insert is rejected; owner data remained intact. All temporary users/data were removed. |
| Responsive smoke | **PASS** | Home, browse, topics, John 3, and login had no horizontal overflow at 360, 768, or 1440 px and retained their critical controls. |
| Auth form polish | **PASS** | Disabled Google/Apple “setup pending” controls are hidden until enabled; verified on the final Vercel deployment. |
| Read-only health run | **CRITICAL as expected** | Database, private storage, HTTP, processing-lock age, and recent failure checks passed. Queue age remained critical. The local disk reading was also critical and is not evidence about Vercel disk capacity. Alert delivery was explicitly disabled. |
| Kokoro recovery | **BLOCKED** | Docker Desktop did not expose a working engine and the host Python environment lacks `kokoro`; no worker job was claimed or mutated. |
