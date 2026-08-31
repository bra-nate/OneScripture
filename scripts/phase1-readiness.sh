#!/usr/bin/env bash
set -uo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
blocked=0

pass() {
  printf '[pass] %s\n' "$1"
}

warn() {
  printf '[warn] %s\n' "$1"
}

block() {
  printf '[block] %s\n' "$1"
  blocked=1
}

printf 'OneScripture hosted Supabase Phase 1 readiness\n'

for command_name in git node; do
  if command -v "$command_name" >/dev/null 2>&1; then
    pass "$command_name is installed"
  else
    block "$command_name is required"
  fi
done

if [[ -f "$project_root/supabase/migrations/0001_init.sql" ]]; then
  pass "Initial Supabase migration is present"
else
  block "Initial Supabase migration is missing"
fi

if [[ -f "$project_root/.env.local" ]]; then
  for key in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
    if grep -Eq "^${key}=.+" "$project_root/.env.local"; then
      pass "$key is configured locally"
    else
      warn "$key is missing from .env.local"
    fi
  done
else
  warn ".env.local is absent"
fi

if (( blocked )); then
  printf '\nPhase 1 local configuration is incomplete.\n'
  exit 1
fi

set -a
# shellcheck disable=SC1091
source "$project_root/.env.local"
set +a

if node <<'NODE'
const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function check(label, path) {
  try {
    const response = await fetch(base + path, {
      headers: { apikey: key },
    });
    console.log(`[${response.ok ? 'pass' : 'block'}] ${label} returned HTTP ${response.status}`);
    return response.ok;
  } catch (error) {
    console.log(`[block] ${label} is unreachable: ${error instanceof Error ? error.message : 'request failed'}`);
    return false;
  }
}

const results = await Promise.all([
  check('Supabase Auth', '/auth/v1/health'),
  check('Supabase REST', '/rest/v1/profiles?select=id&limit=0'),
]);
process.exit(results.every(Boolean) ? 0 : 1);
NODE
then
  printf '\nPhase 1 hosted Supabase configuration is ready.\n'
else
  printf '\nPhase 1 hosted Supabase services are not ready.\n'
  exit 1
fi
