#!/usr/bin/env bash
set -euo pipefail

container_name="onescripture-phase8-restore"
database_name="onescripture"
database_password="phase8-local-only"
work_dir="$(mktemp -d)"
backup_path="$work_dir/onescripture.dump"

cleanup() {
  docker rm -f "$container_name" >/dev/null 2>&1 || true
  rm -rf "$work_dir"
}
trap cleanup EXIT

if docker container inspect "$container_name" >/dev/null 2>&1; then
  echo "Container $container_name already exists; refusing to replace it." >&2
  exit 1
fi

docker run --detach \
  --name "$container_name" \
  --env POSTGRES_PASSWORD="$database_password" \
  --env POSTGRES_DB="$database_name" \
  postgres:16-alpine >/dev/null

for _attempt in $(seq 1 30); do
  if docker exec "$container_name" pg_isready -U postgres -d "$database_name" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "$container_name" pg_isready -U postgres -d "$database_name" >/dev/null

docker exec -i "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -d "$database_name" \
  < scripts/fixtures/recovery-prelude.sql >/dev/null

for migration in supabase/migrations/*.sql; do
  docker exec -i "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -d "$database_name" \
    < "$migration" >/dev/null
done

docker exec -i "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -d "$database_name" \
  < scripts/fixtures/recovery-seed.sql >/dev/null

before_restore="$(docker exec "$container_name" psql -At -U postgres -d "$database_name" -c \
  "select (select count(*) from auth.users), (select count(*) from public.profiles), (select count(*) from public.scripture_translations), (select count(*) from public.scripture_verses), (select count(*) from public.playlists);")"

docker exec "$container_name" pg_dump -Fc -U postgres -d "$database_name" > "$backup_path"
test -s "$backup_path"
backup_sha256="$(shasum -a 256 "$backup_path" | cut -d' ' -f1)"

docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c "drop database $database_name with (force);" >/dev/null
docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c "create database $database_name;" >/dev/null
docker exec -i "$container_name" pg_restore -v --exit-on-error -U postgres -d "$database_name" \
  < "$backup_path" >/dev/null 2>&1

after_restore="$(docker exec "$container_name" psql -At -U postgres -d "$database_name" -c \
  "select (select count(*) from auth.users), (select count(*) from public.profiles), (select count(*) from public.scripture_translations), (select count(*) from public.scripture_verses), (select count(*) from public.playlists);")"
rls_tables="$(docker exec "$container_name" psql -At -U postgres -d "$database_name" -c \
  "select count(*) from pg_class where relnamespace = 'public'::regnamespace and relrowsecurity;")"
worker_functions="$(docker exec "$container_name" psql -At -U postgres -d "$database_name" -c \
  "select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname in ('claim_audio_generation_job', 'complete_audio_generation_job', 'fail_audio_generation_job');")"

test "$before_restore" = "1|1|1|1|1"
test "$after_restore" = "$before_restore"
test "$rls_tables" -ge 10
test "$worker_functions" = "3"

echo "Verified isolated PostgreSQL backup and destructive restore."
echo "Backup SHA-256: $backup_sha256"
echo "Restored row counts: $after_restore"
echo "RLS-enabled public tables: $rls_tables"
echo "Worker lifecycle functions: $worker_functions"
