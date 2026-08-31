-- OneScripture Phase 3 audio catalogue.
-- All metadata writes and reads remain server-only through the service role.

create table public.audio_verse_assets (
  id uuid primary key default gen_random_uuid(),
  scripture_verse_id bigint not null
    references public.scripture_verses (id) on delete restrict,
  voice_id text not null,
  model_id text not null,
  model_version text not null,
  text_hash text not null,
  storage_path text,
  mime_type text,
  duration_ms integer,
  status text not null default 'pending',
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint audio_verse_assets_identity_unique
    unique (scripture_verse_id, voice_id, model_version, text_hash),
  constraint audio_verse_assets_voice_id_format
    check (voice_id ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  constraint audio_verse_assets_model_id_present
    check (length(btrim(model_id)) > 0),
  constraint audio_verse_assets_model_version_format
    check (model_version ~ '^[a-zA-Z0-9][a-zA-Z0-9._-]{1,127}$'),
  constraint audio_verse_assets_text_hash_format
    check (text_hash ~ '^[0-9a-f]{64}$'),
  constraint audio_verse_assets_storage_path_format
    check (storage_path is null or storage_path ~ '^[A-Z0-9_-]+/[a-zA-Z0-9._-]+/[a-z0-9_-]+/(?:[1-3][A-Z]{2}|[A-Z]{3})/[0-9]{3}/[0-9]{3}\.mp3$'),
  constraint audio_verse_assets_storage_path_unique unique (storage_path),
  constraint audio_verse_assets_mime_type
    check (mime_type is null or mime_type = 'audio/mpeg'),
  constraint audio_verse_assets_duration_positive
    check (duration_ms is null or duration_ms > 0),
  constraint audio_verse_assets_status
    check (status in ('pending', 'generating', 'ready', 'failed')),
  constraint audio_verse_assets_ready_fields
    check (
      status <> 'ready'
      or (
        storage_path is not null
        and mime_type = 'audio/mpeg'
        and duration_ms is not null
        and completed_at is not null
      )
    ),
  constraint audio_verse_assets_failed_error
    check (status <> 'failed' or error_code is not null)
);

create index audio_verse_assets_lookup_idx
  on public.audio_verse_assets
  (scripture_verse_id, voice_id, model_version, text_hash, status);

create index audio_verse_assets_status_idx
  on public.audio_verse_assets (status, created_at);

create trigger audio_verse_assets_set_updated_at
before update on public.audio_verse_assets
for each row execute function public.set_updated_at();

create table public.audio_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  audio_verse_asset_id uuid not null
    references public.audio_verse_assets (id) on delete cascade,
  status text not null default 'queued',
  priority smallint not null default 100,
  attempt_count smallint not null default 0,
  max_attempts smallint not null default 3,
  locked_by text,
  locked_at timestamptz,
  available_at timestamptz not null default now(),
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  constraint audio_generation_jobs_status
    check (status in ('queued', 'processing', 'completed', 'failed')),
  constraint audio_generation_jobs_priority_nonnegative check (priority >= 0),
  constraint audio_generation_jobs_attempts
    check (attempt_count >= 0 and max_attempts > 0 and attempt_count <= max_attempts),
  constraint audio_generation_jobs_processing_lock
    check (status <> 'processing' or (locked_by is not null and locked_at is not null)),
  constraint audio_generation_jobs_terminal_time
    check (status not in ('completed', 'failed') or completed_at is not null),
  constraint audio_generation_jobs_failed_error
    check (status <> 'failed' or error_code is not null)
);

create unique index audio_generation_jobs_one_active_idx
  on public.audio_generation_jobs (audio_verse_asset_id)
  where status in ('queued', 'processing');

create index audio_generation_jobs_claim_idx
  on public.audio_generation_jobs (status, available_at, priority, created_at)
  where status = 'queued';

create table public.audio_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  translation_id uuid not null
    references public.scripture_translations (id) on delete restrict,
  voice_id text not null,
  selection_hash text not null,
  status text not null default 'preparing',
  total_items smallint not null,
  ready_items smallint not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint audio_selections_voice_id_format
    check (voice_id ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  constraint audio_selections_hash_format
    check (selection_hash ~ '^[0-9a-f]{64}$'),
  constraint audio_selections_status
    check (status in ('preparing', 'ready', 'partially_failed', 'failed')),
  constraint audio_selections_item_counts
    check (total_items > 0 and ready_items >= 0 and ready_items <= total_items),
  constraint audio_selections_expiry check (expires_at > created_at)
);

create index audio_selections_user_created_idx
  on public.audio_selections (user_id, created_at desc)
  where user_id is not null;

create index audio_selections_expiry_idx
  on public.audio_selections (expires_at);

create table public.audio_selection_items (
  id bigint generated always as identity primary key,
  audio_selection_id uuid not null
    references public.audio_selections (id) on delete cascade,
  scripture_verse_id bigint not null
    references public.scripture_verses (id) on delete restrict,
  audio_verse_asset_id uuid not null
    references public.audio_verse_assets (id) on delete restrict,
  position smallint not null,
  display_ref text not null,
  created_at timestamptz not null default now(),
  constraint audio_selection_items_position_positive check (position > 0),
  constraint audio_selection_items_display_ref_present
    check (length(btrim(display_ref)) > 0),
  constraint audio_selection_items_position_unique
    unique (audio_selection_id, position),
  constraint audio_selection_items_verse_unique
    unique (audio_selection_id, scripture_verse_id)
);

create index audio_selection_items_order_idx
  on public.audio_selection_items (audio_selection_id, position);

alter table public.audio_verse_assets enable row level security;
alter table public.audio_generation_jobs enable row level security;
alter table public.audio_selections enable row level security;
alter table public.audio_selection_items enable row level security;

revoke all on public.audio_verse_assets from public, anon, authenticated;
revoke all on public.audio_generation_jobs from public, anon, authenticated;
revoke all on public.audio_selections from public, anon, authenticated;
revoke all on public.audio_selection_items from public, anon, authenticated;
revoke all on sequence public.audio_selection_items_id_seq
  from public, anon, authenticated;

grant select, insert, update, delete on public.audio_verse_assets to service_role;
grant select, insert, update, delete on public.audio_generation_jobs to service_role;
grant select, insert, update, delete on public.audio_selections to service_role;
grant select, insert, update, delete on public.audio_selection_items to service_role;
grant usage, select on sequence public.audio_selection_items_id_seq to service_role;
