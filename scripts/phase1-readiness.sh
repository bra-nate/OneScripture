#!/usr/bin/env bash
set -uo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
input_file="${PHASE1_INPUT_FILE:-$project_root/infra/phase1/phase1-inputs.env}"
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

has_input() {
  local key="$1"
  [[ -f "$input_file" ]] && grep -Eq "^${key}=.+" "$input_file"
}

printf 'OneScripture Phase 1 readiness\n'

for command_name in git docker openssl ssh; do
  if command -v "$command_name" >/dev/null 2>&1; then
    pass "$command_name is installed"
  else
    block "$command_name is required"
  fi
done

if docker compose version >/dev/null 2>&1; then
  pass "Docker Compose is installed"
else
  block "Docker Compose is required"
fi

if docker info >/dev/null 2>&1; then
  pass "Docker daemon is running"
else
  warn "Docker daemon is not running; local stack validation is unavailable"
fi

if git -C "$project_root" remote get-url origin >/dev/null 2>&1; then
  pass "Git origin is configured"
else
  block "Git origin is not configured"
fi

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

if [[ ! -f "$input_file" ]]; then
  block "copy infra/phase1/phase1-inputs.example to phase1-inputs.env"
else
  for key in VPS_HOST VPS_SSH_USER APP_DOMAIN SUPABASE_DOMAIN TLS_EMAIL SMTP_HOST SMTP_PORT SMTP_USER SMTP_FROM BACKUP_TARGET; do
    if has_input "$key"; then
      pass "$key is supplied"
    else
      block "$key is missing from phase1-inputs.env"
    fi
  done
fi

if (( blocked )); then
  printf '\nPhase 1 is not ready for remote deployment.\n'
  exit 1
fi

printf '\nPhase 1 deployment inputs are ready.\n'
