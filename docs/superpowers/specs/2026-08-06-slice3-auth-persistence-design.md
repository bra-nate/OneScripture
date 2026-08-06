# Slice 3 — Auth + Persistence (Design)

**Date:** 2026-08-06
**Status:** Approved. Part of the Phase 1 roadmap (see `2026-08-04-onescripture-phase1-roadmap-design.md`).
**Depends on:** Slice 0 (Foundation). Runs in parallel with the Bible.is key wait — needs no Bible.is key.

## Confirmed decisions

| Decision | Choice |
|---|---|
| Supabase project | Live (created by user); credentials in `.env.local` (gitignored). New-format keys: publishable = anon, secret = service_role. |
| Auth methods | Email/password fully working this slice. Google OAuth: button rendered but disabled ("coming soon"); wired in a follow-up once Google Cloud creds exist. |
| Email confirmation | ON (`mailer_autoconfirm: false`). Signup shows a "check your inbox" state; user confirms via email link, then logs in. |
| Client library | `@supabase/ssr` — browser client, server client (cookie-based), middleware session refresh. |
| Auth logic | Next server actions (`signUp`, `signIn`, `signOut`), not client-side calls. |
| Protected routes | `middleware.ts` guards `/dashboard`, `/playlist/*`, `/history`, `/favourites`, `/settings` → redirect to `/login` when unauthenticated. |
| Dashboard | Minimal placeholder `/dashboard` (protected) this slice — verifies redirect + logged-in state. S09 is built in Slice 4. |
| DB migrations | SQL migration file authored here; **applied by the user in the Supabase SQL editor** (no DB password / PAT shared, so DDL can't be run programmatically). Verified afterward via the API. |
| Schema | `profiles`, `playlists`, `playlist_items`, `downloads`, `favourites` + RLS, exactly per `DATA.md`, plus a trigger auto-creating `profiles` on signup. |

## Architecture

`@supabase/ssr` cookie-based sessions across the App Router:

- **Browser client** (`src/lib/supabase/client.ts`) — for client components.
- **Server client** (`src/lib/supabase/server.ts`) — reads/writes auth cookies via `next/headers`; used in server components and server actions.
- **Middleware helper** (`src/lib/supabase/middleware.ts`) — refreshes the session cookie on every request and returns the (possibly updated) response.
- **Root `middleware.ts`** — calls the helper, then redirects unauthenticated requests for protected paths to `/login`.

## Units

| File | Responsibility |
|---|---|
| `src/lib/supabase/client.ts` | `createClient()` browser client from `NEXT_PUBLIC_*` env. |
| `src/lib/supabase/server.ts` | `createClient()` server client bound to request cookies. |
| `src/lib/supabase/middleware.ts` | `updateSession(request)` → refreshes session, returns response + user. |
| `middleware.ts` | Session refresh + protected-route redirect. `config.matcher` excludes static assets. |
| `src/lib/auth/validation.ts` | Pure `validateEmail`, `validatePassword` helpers (unit-tested). |
| `src/lib/auth/protected.ts` | Pure `isProtectedPath(pathname)` (unit-tested); single source of the protected-route list. |
| `src/app/(auth)/actions.ts` | `signUp`, `signIn`, `signOut` server actions; return typed `{ error }` for the UI. |
| `src/app/(auth)/signup/page.tsx` | S07 — designed signup card + "check your inbox" success state. |
| `src/app/(auth)/login/page.tsx` | S08 — designed login card. |
| `src/components/auth/AuthCard.tsx` | Shared card chrome (wordmark, heading, slot). |
| `src/components/auth/AuthForm.tsx` | Client form (email/password inputs, submit, error display, disabled Google button). |
| `src/components/layout/Nav.tsx` | Modified: auth-aware (Dashboard/Settings/Sign Out when logged in). |
| `src/app/(main)/dashboard/page.tsx` | Placeholder protected dashboard. |
| `supabase/migrations/0001_init.sql` | Tables + RLS + profile trigger. |

## Data flow

- **Signup:** form → `signUp` action → `supabase.auth.signUp` → (confirmation on) show "check your inbox". On confirm + first login, the DB trigger has created the `profiles` row.
- **Login:** form → `signIn` action → session cookie set → redirect to `/dashboard`.
- **Protected access:** middleware reads session; no user + protected path → redirect `/login`.
- **Logout:** `signOut` action → clear session → redirect `/`.

## Error handling

- Client-side validation (email format, password length ≥ 6) before submit, via `validation.ts`.
- Supabase errors surfaced in the form: invalid credentials, email already registered, weak password, unconfirmed email on login.
- Server actions never throw to the client; they return `{ error: string }`.

## Testing

- **Unit (TDD):** `validation.ts` and `protected.ts` — pure logic.
- **Live verification (browser + API):** real signup (check-inbox state), email confirm, login, session persists across navigation, protected-route redirect when logged out, logout. After the user applies the migration: confirm tables exist and RLS blocks cross-user reads (verified with the service key creating a test user + an anon-key session).

## Done when

- A user can sign up (see check-inbox state), confirm, log in, and stay logged in across navigation.
- Protected routes redirect to `/login` when logged out; reachable when logged in.
- Logout returns to `/` and re-protects routes.
- Migration applied; all five tables exist with RLS; a cross-user read is denied.
- `npm run build`, `npm test`, `npm run lint` all clean.
