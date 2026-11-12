# Feature and Screen Inventory

## Route inventory

| Route | Role | Purpose / primary action | Data or service | States observed or implemented | Verification |
| --- | --- | --- | --- | --- | --- |
| `/` | Public | Understand value; search or browse | Auth state for nav only | Default | Browser PASS |
| `/search` | Public | Parse a scripture reference | Local reference parser | Empty, valid best match, invalid query | Browser PASS |
| `/browse` | Public | Choose a Bible book | Static book catalogue | Full OT/NT list | Browser PASS |
| `/browse/[bookId]` | Public | Choose a chapter | Static book metadata | Valid book, 404 | Browser PASS for John |
| `/passage/[bookId]/[chapter]` | Public / registered | Read/select verses and start audio; signed-in user can save a verse | Supabase catalogue/auth/playlists; selection API | Loading, passage, not found, catalogue fallback | Recheck PASS for canonical John 3:16; live audio still blocked |
| `/topics` | Public | Choose a curated need-based collection | Supabase topics | Loading, directory, unavailable | FAIL: deployed topic tables are absent |
| `/topics/[slug]` | Public | Inspect and play ordered topical references | Supabase topics/catalogue/audio | Loading, detail, unavailable, 404 | Source reviewed; live detail BLOCKED |
| `/login` | Public | Authenticate | Supabase Auth | Form, validation/error, OAuth disabled/pending | UI reviewed; live auth BLOCKED |
| `/signup` | Public | Create account | Supabase Auth/email | Form, validation/error, check-email | UI reviewed; live signup BLOCKED |
| `/auth/callback` | Public | Exchange OAuth/email callback | Supabase Auth | Success redirect/error redirect | Source reviewed; NOT RUN |
| `/playlist` | Registered | Create/list playlists | Supabase Auth/RLS | Create, empty, list | Anonymous guard PASS; authenticated BLOCKED |
| `/playlist/[playlistId]` | Registered owner | Play playlist, remove items, add via browse | Supabase Auth/RLS/audio | Empty, populated, 404 | Source reviewed; live BLOCKED |
| `/api/audio/selections` | Public / registered | Create bounded canonical audio selection | Catalogue, DB RPC, rate limit | 200/202 and structured 4xx/5xx | Invalid JSON PASS; live create BLOCKED |
| `/api/audio/selections/[selectionId]` | Selection owner/anonymous creator | Poll readiness and receive signed URLs | DB/storage | Ready/preparing/partial/failed/404 | Invalid UUID PASS; live status BLOCKED |
| `/api/audio/selections/[selectionId]/retry` | Selection owner/anonymous creator | Retry eligible failed work | DB worker queue | Retried/no eligible/error | Unit/source only |
| Global not-found | Public | Recover from invalid URL/reference | None | 404 with search/browse CTAs | Browser PASS |
| Global error boundary | All | Recover from unexpected render failure | Client reset | Error, digest, reset | Source reviewed; NOT FORCED |

## Feature-to-role mapping

| Feature | Anonymous | Registered | Editorial | Operations | Readiness |
| --- | --- | --- | --- | --- | --- |
| Reference search | Use | Use | — | — | Working locally |
| Browse books/chapters | Use | Use | — | — | Working locally |
| Canonical scripture text | Use | Use | Source consumer | Verify | Verified working; 31,103 verses |
| Verse/range/chapter selection | Use | Use | — | — | Component logic tested; live blocked |
| Kokoro narration and playback | Use | Use | — | Worker owner | Automated tests pass; live blocked |
| Voice/speed/volume/repeat preferences | Use | Use | — | — | Automated PASS |
| Topics | Use | Use | Publish/review | Monitor | Content validates locally; migration 0005 is absent remotely |
| Email/password auth | — | Use | — | Configure/monitor | Live blocked |
| Google/Apple OAuth | — | Intended | — | Configure | Disabled as “setup pending” |
| Playlist create/list/add/remove/play | — | Use | — | — | Live blocked; partial unit coverage |
| Monitoring/alerts | — | — | — | Use | Missing runtime target; blocked |
| Backup/storage recovery | — | — | — | Use | Historical drill evidence only; not rerun |

## Dead, missing, or misleading controls/states

- OAuth buttons are intentionally disabled but occupy primary auth-space with “setup pending”; acceptable for internal preview, not polished public release.
- The login screen has no “Forgot password” action despite recovery being a production release gate.
- Signup copy promises “Bookmark favourites,” but there is no active favourites route or control in the current route map.
- `PROTECTED_PREFIXES` still includes `/dashboard`, `/history`, `/favourites`, and `/settings`; none has a screen in the current build.
- Passage and topic fallback states contain no retry button, service-status link, or preserved-action explanation.
- The global error boundary claims scripture text/audio are unaffected even when the underlying failure may be the scripture/audio service.

## State coverage gaps

- No browser proof for successful/failed email delivery, expired confirmation, expired recovery, or OAuth cancellation.
- No browser proof for authenticated playlist empty/populated/mutation failures.
- No current live proof for preparing, partially failed, failed, retry, signed-URL expiry, or worker recovery; 67 jobs are stale in the queue.
- No explicit offline state; network failures collapse into generic catalogue/audio messages.
- Playlist reads collapse service errors into empty/not-found, so an outage cannot be distinguished from a true empty or missing resource.

## Accessibility and responsive observations

- Positive: skip link, semantic headings/landmarks, associated form labels, focus-visible outline, reduced-motion override, live regions, labeled player controls, and non-color status labels.
- Confirmed issue: auth cross-link accent `#8ed462` on white is 1.79:1, below 4.5:1 for normal text (WCAG 1.4.3 AA).
- No horizontal overflow observed at 360 × 812, 768 × 1024, or 1440 × 900 on key public routes.
- Several navigation and editorial text links expose rendered heights around 17–28 px; they miss the 44 px enhanced touch-target recommendation even though spacing may satisfy WCAG 2.5.8's minimum/spacing exception.

## Anti-pattern scan

- No cyan-on-dark palette, gradient text, glassmorphism, decorative sparklines, bounce easing, or hero-metric template.
- Decorative geometry is purposeful and consistent with the chosen editorial system.
- Caution: Inter is used for display, serif, and body roles; large rounded surfaces recur on most screens. These reduce distinctiveness but do not impair task completion.
