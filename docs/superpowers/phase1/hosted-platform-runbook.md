# Phase 1 — Hosted Supabase platform runbook

**Started:** 2026-08-31  
**Status:** Hosted project active; core schema and RLS verified

## Approved platform

- Use the existing hosted Supabase project referenced by
  `NEXT_PUBLIC_SUPABASE_URL`.
- Do not run Supabase locally.
- Do not provision a replacement VPS or self-hosted Supabase stack without a
  separate deployment decision.
- Keep the anonymous key browser-safe and keep the service-role key server-only.
- Never commit `.env.local` or production secrets.

## Completed checks

- Auth health endpoint returned HTTP 200.
- Email/password signup is enabled, email confirmation is required, phone Auth
  is disabled, and signup is open.
- Google and GitHub OAuth providers are currently disabled.
- PostgREST returned HTTP 200.
- `0001_init.sql` was applied successfully through the Supabase SQL Editor.
- `profiles`, `playlists`, `playlist_items`, `downloads`, and `favourites` are
  available through PostgREST.
- Two isolated temporary users verified login, logout, automatic profile
  creation, owned-row access, and cross-user denial for all Phase 1 data paths.
- Both temporary users and their cascaded test rows were removed.
- Public application routes returned HTTP 200 and unauthenticated `/dashboard`
  access redirected to `/login`.
- Unit tests and lint passed.
- The production application compiled successfully with Next.js 16's supported
  Webpack fallback. Turbopack cannot bind its internal port in the Codex sandbox.

## Remaining production checks

1. Configure the production application with the same project URL and correct
   environment-specific keys.
2. Configure Auth site URL and allowed redirect URLs for the production domain.
3. Configure and test confirmation and recovery email delivery.
4. Configure Google OAuth only if it remains in the MVP scope.
5. Deploy the application and repeat signup, login, logout, session refresh,
   and protected-route checks on the production origin.
6. Confirm the hosted Supabase backup/PITR capability for the selected plan and
   document a recovery procedure before accepting production data.

## Deferred social-provider activation

The application code supports Google and Apple OAuth through the PKCE callback
at `/auth/callback`. Both controls remain disabled until their provider flag is
enabled.

Development environment:

```text
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false
NEXT_PUBLIC_APPLE_AUTH_ENABLED=false
```

Before enabling either control:

1. Add `http://localhost:3000/auth/callback` to the Supabase Auth redirect
   allow list.
2. Configure the provider in the hosted Supabase dashboard.
3. Use `https://fjtruktclyrbkzyjmvqy.supabase.co/auth/v1/callback` as the
   provider-console callback URL.
4. Set the matching `NEXT_PUBLIC_*_AUTH_ENABLED` flag to `true` and restart the
   application.
5. Complete a real login, profile-trigger, protected-route, and logout test.

Apple additionally requires an Apple Developer App ID, Services ID, signing
key, and scheduled client-secret rotation every six months. Provider secrets
belong only in the provider console and Supabase dashboard, never in this
repository.

## Local readiness

Run:

```sh
bash scripts/phase1-readiness.sh
```

The script checks only local configuration and hosted-project reachability. It
does not create users, mutate rows, start Docker, or apply migrations.
