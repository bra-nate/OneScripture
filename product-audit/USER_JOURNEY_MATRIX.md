# User Journey Coverage Matrix

Status vocabulary: **PASS**, **FAIL**, **PARTIAL**, **BLOCKED**, **NOT RUN**.

| ID | Persona | Goal | Preconditions | Entry / ordered steps | Screens and actions | Expected outcome | Evidence | Status | Severity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| J01 | Anonymous listener | Find a reference and hear it | Working catalogue, selection API, storage, worker | Home → enter `John 3:16` → search result → passage → listen | `/`, `/search`, `/passage/JHN/3?verseStart=16`; input, result link, player | Canonical verse appears and audio prepares/plays | Recheck: official catalogue verification passes and John 3:16 renders. Live audio was not created because that would mutate hosted state; the worker queue is stale. | **PARTIAL** | P1 |
| J02 | Anonymous listener | Browse without knowing a search syntax | Working catalogue | Browse → John → chapter 3 → passage → listen | `/browse`, `/browse/JHN`, passage | Complete chapter text and player load | Book/chapter navigation and canonical passage text pass; live generation/playback remains unverified with a stale queue. | **PARTIAL** | P1 |
| J03 | Anonymous listener | Listen by emotional/topic need | Published topics and working catalogue/audio | Topics → choose topic → review order → play | `/topics`, `/topics/[slug]` | Published collection and ordered player load | `/topics` remains unavailable. Direct API check returns `PGRST205`: deployed topic tables are missing. | **FAIL** | P1 |
| J04 | New registered listener | Create and confirm an account | Working Supabase Auth and production email | Sign up → confirmation email → callback → login | `/signup`, `/auth/callback`, `/login` | Confirmed account and authenticated session | Auth service health passes, but no external test identity/email was created; production email gate remains open. | **BLOCKED** | P1 |
| J05 | Registered listener | Create and manage a personal playlist | Authenticated test user, working DB/RLS | Login → create playlist → add verse → open → play → remove | `/login`, `/playlist`, passage, `/playlist/[id]` | Changes persist only for owner and replay in order | Anonymous redirect passed; mutation journey could not run. Unit tests cover name/reference validation only. | **BLOCKED** | P1 |
| J06 | Anonymous or registered listener | Generate/reuse missing audio and recover from failure | Working DB, storage, worker | Select verses → create selection → poll → worker generates/reuses → signed URLs → play/retry | Passage/topic/player and three selection API routes | Ordered ready items play; transient failure retries; permanent failure is explained | Client/orchestration/player/worker tests pass. Hosted state has 67 queued/pending, 0 processing/generating, and only 18 ready assets; oldest queue item is from 3 September. | **BLOCKED** | P1 |
| J07 | Returning listener | Keep playback preferences across navigation/refresh | Browser storage | Change voice/speed/volume/repeat → navigate/reload | Player preferences | Preferences restore safely | Automated preference hydration/persistence and loop behavior tests passed. | **PASS** | — |
| J08 | Anonymous listener | Recover from invalid input or missing route | None | Search `peace`; open unknown route; invalid API JSON | `/search?q=peace`, `/does-not-exist`, selection API | Helpful reference guidance, 404, structured API error | Browser and HTTP smoke tests observed expected states (`404`, `400`). | **PASS** | — |
| J09 | Anonymous listener | Be prevented from viewing private playlists | Logged out | Open `/playlist` directly | Protected route middleware | Redirect to login without leaking private data | Local HTTP returned `307 /login`; browser arrived at login. | **PASS** | — |
| J10 | Operations owner | Detect web/database/queue/storage/disk failure | Production URL and service credentials | Run scheduled health command → alert on warning/critical | `npm run release:health` | Complete JSON health report and correct exit code | Direct read-only checks found Auth/storage healthy but topics missing and queue stale. Canonical command still lacks `ONESCRIPTURE_APP_URL`. | **BLOCKED** | P1 |
| J11 | Existing registered listener | Recover a forgotten password | Recovery route/action and production email configuration | Login → forgot password → email → reset → login | Not implemented | Account access is restored securely | Required by the hosted-platform release checklist, but no route/action exists. | **NOT RUN** | P1 |

## Journey coverage notes

- **Discovered:** 11 journeys.
- **Executed in some form:** 7 (J01, J02, J03, J07, J08, J09, J10).
- **Passed:** 3/7 executed journeys.
- **Partial:** 2/7 executed journeys.
- **Failed:** 1/7 executed journeys.
- **Blocked during execution:** 1/7.
- **Not fully executable because of environment/capability gaps:** J04, J05, J06, J10, J11.
- Historical claims in phase runbooks were treated as prior evidence, not current PASS results.

## Required acceptance journey suite before release

1. Anonymous `John 3:16`: text visible, female voice prepares/plays, then male voice reuses/generates correctly.
2. Anonymous Psalms 23 chapter: ordered preparation progress, verse transition, repeat mode, refresh persistence.
3. Topical collection: published order matches editorial JSON and plays end to end.
4. New account: signup, confirmation, login, logout, password recovery, expired-link handling.
5. Two-user playlist isolation: owner CRUD succeeds; second user cannot read or mutate it.
6. Worker failure: a transient synthesis error retries; a permanent error becomes actionable UI; no duplicate asset/job appears.
7. Backend outage: passage/topic pages fail quickly, accurately describe the outage, and offer retry without losing the requested reference.
