# Phase 8 — Legacy removal and release safety

**Started:** 2026-09-03

**Status:** Complete

## Legacy removal completed

- Deleted the `/download` page and `/api/download` route. Requests to both now
  resolve through the application's 404 boundary, so no public endpoint accepts
  an arbitrary remote audio URL.
- Deleted the unused Bible.is audio resolver, API client, URL builders, response
  types, unit tests, and manual spike command.
- Removed the download-only route theme and advertising slot.
- Replaced signup and history copy that promised download tracking with
  collection and listening-language appropriate to the Kokoro playback MVP.
- Kept historical planning records and the scripture-rights capability column;
  they document previous decisions and future rights, but expose no runtime
  Bible.is or arbitrary-download behavior.

## Verification

```sh
npm test
npm run lint -- --no-cache
npx tsc --noEmit
npx next build --webpack
```

- 107 tests across 22 files pass after removing the obsolete URL-builder tests
  and adding release-health and player-accessibility coverage.
- ESLint, TypeScript, and the Next.js 16.3 webpack production build pass.
- The production route manifest contains neither `/download` nor
  `/api/download`.
- Browser checks confirmed both legacy URLs render the 404 boundary.

## Operational monitoring

Run the monitor once per minute from the worker host:

```sh
npm run release:health
```

Configuration is documented in `ops/monitor.env.example`. The command emits one
JSON report, returns `0` for healthy, `1` for warning, and `2` for critical, and
optionally posts warning/critical reports to `ONESCRIPTURE_ALERT_WEBHOOK_URL`.
The primary on-call operator owns initial response; the infrastructure owner is
the escalation contact when the first response does not clear a critical alert
within 15 minutes.

| Signal | Warning | Critical | First response |
| --- | --- | --- | --- |
| Oldest available job | 120 seconds | 600 seconds | Check worker state/logs; restart one worker; verify the queue falls. |
| Oldest processing lock | 600 seconds | 900 seconds | Inspect the active worker; stale locks recover on the next claim. |
| Terminal failures in 15 minutes | 1 | 5 | Group by `error_code`; retry only transient, understood failures. |
| Worker-host free disk | 20% | 10% | Stop new generation if needed; clear only verified disposable cache or expand storage. |
| Database query | — | Any failure | Check Supabase status/network, then application credentials without logging secrets. |
| Private audio bucket | — | Missing, unreachable, or public | Disable preparation, restore bucket configuration, then run the storage drill. |
| HTTP probe | Any 4xx | 5xx, timeout, or network failure | Inspect deployment/reverse-proxy logs and roll back the latest release if correlated. |

The deployment platform or reverse proxy must additionally alert when 5xx
responses exceed 1% of requests for five minutes or reach five responses in
five minutes. Send these alerts to the same on-call destination as the command
webhook. Keep 30 days of application and worker JSON logs.

The local verification returned healthy database, queue, failures, Storage, and
HTTP checks. It deliberately raised a critical disk alert because the
development Mac had roughly 2.2% free space, proving the threshold and exit code
without treating the workstation as the production capacity baseline.

## Backup and restore procedure

Supabase database backups do not contain Storage object bytes, so database,
Storage, and encrypted configuration are separate backup streams:

1. Keep the hosted daily database backup appropriate to the selected Supabase
   plan. Before launch, record the visible retention window in the release log;
   enable PITR when the required database RPO is shorter than one day.
2. Export an encrypted logical database backup after every migration and at
   least daily. Copy it to an off-account object store with immutability and a
   30-day retention policy. Never place dumps or credentials in this repository.
3. Mirror the private `scripture-audio` bucket daily through Supabase's
   S3-compatible endpoint or Storage API. Database restoration alone restores
   only Storage metadata, not object bytes.
4. Back up environment configuration and version pins to the encrypted secrets
   manager after every change.
5. Quarterly, restore the latest database dump to an isolated database, restore
   the Storage mirror to an isolated bucket, rotate restored custom-role
   passwords, and run catalogue, RLS, signed-range, and application smoke tests.
6. Record backup timestamp, SHA-256, object count, RPO, elapsed restore time,
   verifier, and outcome in the release log. Delete the isolated target after
   evidence is retained.

The repository drill creates a disposable PostgreSQL 16 container, applies all
migrations, seeds identity and scripture data, takes a custom-format dump,
destroys and recreates the database, restores the dump, and verifies row counts,
RLS, and worker functions:

```sh
npm run release:verify-restore
```

## Recovery drill evidence

- **Database:** the isolated destructive restore preserved `1|1|1|1|1` seeded
  user/profile/translation/verse/playlist counts, 14 RLS-enabled tables, and all
  three worker lifecycle functions. The dump was non-empty and SHA-256 recorded.
- **Storage loss:** a uniquely named temporary hosted object was uploaded,
  range-read, removed, confirmed absent through the authenticated Storage API,
  restored byte-for-byte, range-read again, and removed during cleanup.
- **Expired URL:** a one-second signed URL worked before expiry, failed after
  expiry with cache bypass, and a newly signed URL restored byte-range playback.
- **Worker restart:** the worker integration suite now proves that a transiently
  interrupted job is durably requeued and completed by a new worker instance on
  the next attempt with temporary files cleaned.

Run the hosted Storage and URL drill with:

```sh
npm run release:verify-storage
```

## Player accessibility and responsive verification

The full report is in `player-interface-audit.md`. Automated axe-core checks
report zero semantic violations. Chromium was verified at phone portrait,
phone landscape, tablet, and desktop widths with no horizontal overflow and
44-pixel minimum targets. Keyboard focus and contrast pass. Safari exposed all
controls and their states through its accessibility tree, prepared a real
hosted asset, and played it with advancing elapsed time.

## Release limitations

- A physical iOS device test is recommended after deployment; desktop Safari
  and narrow responsive layouts cover the release gate available locally.
- The current Supabase CLI account does not list the hosted OneScripture project,
  so the operator must record the dashboard's actual backup retention before
  production launch. The independent restore mechanism and procedure are tested.
