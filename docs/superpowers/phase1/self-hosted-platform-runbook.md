# Phase 1 — Self-hosted platform runbook

**Started:** 2026-08-31
**Status:** Deployment preparation in progress; remote inputs pending

## Fixed decisions

- One Ubuntu LTS VPS with 4 CPU cores, 8 GB RAM, and 160 GB SSD.
- Official Supabase Docker stack pinned to `self-hosted/v0.8.0`.
- Supabase's default local-filesystem Storage backend on a persistent volume.
- Supabase API and Studio behind the official TLS reverse-proxy overlay.
- Next.js application, Supabase, and Kokoro worker share the first VPS, with
  explicit CPU and memory limits before the worker is enabled.
- Database and Storage backups leave the VPS and are restore-tested.

The official Supabase minimum is 2 cores, 4 GB RAM, and 40 GB SSD; its
recommended starting point is 4 cores, 8 GB RAM, and 80 GB SSD. The larger disk
in this plan reserves space for generated verse audio and local backup staging.

Primary references:

- <https://supabase.com/docs/guides/self-hosting/docker>
- <https://supabase.com/docs/guides/self-hosting>
- <https://supabase.com/docs/guides/self-hosting/auth/config>
- <https://supabase.com/docs/guides/self-hosting/self-hosted-s3>

## Current readiness

| Area | State | Evidence / next action |
| --- | --- | --- |
| Phase 0 | Ready | WEB source, Kokoro model, both voices, and MP3 settings accepted. |
| Docker CLI and Compose | Ready | Docker 29.6.1 and Compose 5.3.0 installed locally. |
| Local Docker daemon | Not running | Start Docker Desktop only if local stack validation is desired. |
| Application Supabase integration | Ready | Browser, server, and proxy helpers use URL/key environment variables. |
| Initial database migration | Ready | `supabase/migrations/0001_init.sql` contains tables, RLS, and signup trigger. |
| Git push | Blocked | Repository has no `origin` remote. |
| VPS | Blocked | Host and SSH user not supplied. |
| DNS/TLS | Blocked | Application domain, Supabase domain, and TLS email not supplied. |
| SMTP | Blocked | SMTP host, port, user, and sender not supplied. |
| Off-server backups | Blocked | Independent backup target not supplied. |

Run the repository preflight at any time:

```sh
bash scripts/phase1-readiness.sh
```

Copy `infra/phase1/phase1-inputs.example` to
`infra/phase1/phase1-inputs.env` and fill only the non-secret values. The real
input file is ignored by Git. Passwords and API keys are generated or installed
directly on the VPS and must not be placed in the repository.

## Target topology

```text
Internet
  |
  | TCP 80/443 only
  v
Caddy or Nginx TLS proxy
  |-- APP_DOMAIN      -> Next.js application
  `-- SUPABASE_DOMAIN -> Supabase API gateway / protected Studio

Private Docker network
  |-- Next.js
  |-- Supabase API, Auth, REST, Storage, Studio, Postgres, Supavisor
  `-- Kokoro worker (added in Phase 4, concurrency 1)

Persistent VPS filesystem
  |-- Supabase Postgres data
  |-- Supabase Storage objects
  `-- temporary encrypted backup staging

Independent physical system
  `-- encrypted database + Storage backups
```

Postgres, Supavisor, Studio, and the Kokoro worker must not be directly exposed
to the public Internet. Studio remains protected by a generated dashboard
password in addition to TLS.

## Deployment sequence

### 1. Provision and harden the VPS

1. Create the Ubuntu LTS VPS with an SSH key; do not enable password login.
2. Create a non-root deployment user with narrowly scoped `sudo` access.
3. Apply all OS updates and enable automatic security updates.
4. Configure the host firewall to allow SSH from an administrative source and
   public TCP 80/443 only.
5. Install Docker Engine from Docker's official Ubuntu repository and install
   the Compose plugin.
6. Configure Docker log rotation and confirm the filesystem has enough free
   inodes as well as free bytes.

Record the exact OS, kernel, Docker, and Compose versions in the deployment log.

### 2. Configure DNS

Create A/AAAA records for `APP_DOMAIN` and `SUPABASE_DOMAIN` pointing to the VPS.
Confirm both resolve to the expected address before requesting certificates.

### 3. Install the pinned official Supabase stack

Run on the VPS in a deployment-owned directory:

```sh
git clone --depth 1 --branch self-hosted/v0.8.0 https://github.com/supabase/supabase.git supabase-upstream
mkdir -p supabase-project
cp -R supabase-upstream/docker/. supabase-project/
cd supabase-project
cp .env.example .env
printf 'ref=self-hosted/v0.8.0\n' > .supabase-version
sh utils/generate-keys.sh
sh utils/add-new-auth-keys.sh
```

Do not start the containers while any example password or key remains. Keep the
generated `.env` readable only by the deployment user.

Configure at minimum:

```text
SUPABASE_PUBLIC_URL=https://SUPABASE_DOMAIN
API_EXTERNAL_URL=https://SUPABASE_DOMAIN/auth/v1
SITE_URL=https://APP_DOMAIN
ADDITIONAL_REDIRECT_URLS=https://APP_DOMAIN/**
PROXY_DOMAIN=SUPABASE_DOMAIN
CERTBOT_EMAIL=TLS_EMAIL
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
SMTP_ADMIN_EMAIL=SMTP_FROM
SMTP_HOST=SMTP_HOST
SMTP_PORT=SMTP_PORT
SMTP_USER=SMTP_USER
SMTP_PASS=<installed directly on VPS>
SMTP_SENDER_NAME=OneScripture
ENABLE_PHONE_SIGNUP=false
ENABLE_ANONYMOUS_USERS=false
```

Use the generated publishable key in `NEXT_PUBLIC_SUPABASE_ANON_KEY` and the
generated server-side secret key in `SUPABASE_SERVICE_ROLE_KEY`. Despite the
legacy application variable names, do not expose the server-side key to the
browser.

### 4. Start and verify Supabase

Enable the official Caddy or Nginx TLS overlay, then start with the upstream
helper:

```sh
sh run.sh start
docker compose ps
```

All required services must report healthy. Verify HTTPS, Studio authentication,
Auth health, REST health, and that only intended host ports are listening.

### 5. Apply application migrations

Apply `supabase/migrations/0001_init.sql` to the self-hosted Postgres instance.
Record the file hash and application time. Then verify:

- every public application table has RLS enabled;
- a signup creates exactly one profile row;
- users cannot read or mutate another user's rows;
- playlist items are accessible only through an owned playlist.

Migrations are forward-only. Never edit a migration after it has been applied.

### 6. Point the application at the VPS

Set the application environment to the self-hosted public URL and generated
keys, deploy the app, and verify signup, confirmation email, login, logout,
session refresh, and all protected routes.

### 7. Establish backups before audio generation

At minimum:

- daily encrypted logical Postgres backup;
- daily encrypted copy of the Storage filesystem and metadata;
- retention with multiple daily and weekly recovery points;
- transfer to a different physical system;
- alert on failed or stale backups;
- documented quarterly restore drill into an isolated environment.

A backup is not accepted until a restore has been completed and the restored
row counts, authentication data, and Storage objects have been verified.

## Phase 1 completion gates

- Existing application behavior works against the self-hosted instance.
- HTTPS is valid for both public domains.
- SMTP confirmation and recovery messages arrive successfully.
- RLS cross-user tests pass.
- Postgres and Storage are not exposed directly.
- Resource limits prevent future Kokoro work from starving the web/database.
- Automated off-server backups run successfully.
- A full restore procedure has been executed and recorded.
