-- OneScripture Phase 5 atomic selection orchestration and anonymous rate limits.
-- Public API routes call these functions through the service role only.

create table public.audio_selection_rate_limits (
  rate_limit_key text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (rate_limit_key, window_started_at),
  constraint audio_selection_rate_limit_key_hash
    check (rate_limit_key ~ '^[0-9a-f]{64}$'),
  constraint audio_selection_rate_limit_count_positive
    check (request_count > 0)
);

create index audio_selection_rate_limits_updated_idx
  on public.audio_selection_rate_limits (updated_at);

alter table public.audio_selection_rate_limits enable row level security;
revoke all on public.audio_selection_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.audio_selection_rate_limits
  to service_role;

create or replace function public.consume_audio_selection_rate_limit(
  p_rate_limit_key text,
  p_max_requests integer default 10,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_window timestamptz;
  current_count integer;
begin
  if p_rate_limit_key !~ '^[0-9a-f]{64}$' then
    raise exception 'rate limit key must be a SHA-256 hash';
  end if;
  if p_max_requests < 1 or p_max_requests > 100 then
    raise exception 'maximum requests must be between 1 and 100';
  end if;
  if p_window_seconds < 10 or p_window_seconds > 3600 then
    raise exception 'rate limit window must be between 10 and 3600 seconds';
  end if;

  current_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.audio_selection_rate_limits (
    rate_limit_key,
    window_started_at,
    request_count,
    updated_at
  ) values (
    p_rate_limit_key,
    current_window,
    1,
    now()
  )
  on conflict (rate_limit_key, window_started_at)
  do update set
    request_count = public.audio_selection_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into current_count;

  delete from public.audio_selection_rate_limits
  where rate_limit_key = p_rate_limit_key
    and window_started_at < now() - interval '24 hours';

  return current_count <= p_max_requests;
end;
$$;

create or replace function public.create_audio_selection(
  p_user_id uuid,
  p_translation_code text,
  p_voice_id text,
  p_model_id text,
  p_model_version text,
  p_selection_hash text,
  p_scripture_verse_ids bigint[],
  p_display_refs text[],
  p_expires_in_seconds integer default 3600
)
returns table (
  selection_id uuid,
  selection_status text,
  ready_count integer,
  total_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_translation record;
  created_selection_id uuid;
  selected_count integer;
  selected_ready integer;
  selected_failed integer;
  next_status text;
begin
  if upper(btrim(p_translation_code)) <> 'WEB' then
    raise exception 'unsupported audio translation';
  end if;
  if p_voice_id not in ('af_heart', 'am_michael') then
    raise exception 'unsupported audio voice';
  end if;
  if p_model_id <> 'hexgrad/Kokoro-82M'
    or p_model_version <> 'kokoro-82m-v1.0-f3ff357' then
    raise exception 'unsupported audio model';
  end if;
  if p_selection_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'selection hash must be a SHA-256 hash';
  end if;
  if p_expires_in_seconds < 300 or p_expires_in_seconds > 86400 then
    raise exception 'selection expiry must be between 300 and 86400 seconds';
  end if;
  if coalesce(cardinality(p_scripture_verse_ids), 0) < 1
    or cardinality(p_scripture_verse_ids) > 200
    or cardinality(p_scripture_verse_ids) <> cardinality(p_display_refs) then
    raise exception 'selection must contain 1 to 200 verses and matching references';
  end if;
  if exists (
    select 1
    from unnest(p_display_refs) as display_ref
    where length(btrim(display_ref)) < 1 or length(display_ref) > 100
  ) then
    raise exception 'selection display references must contain 1 to 100 characters';
  end if;
  if (
    select count(distinct verse_id)
    from unnest(p_scripture_verse_ids) as verse_id
  ) <> cardinality(p_scripture_verse_ids) then
    raise exception 'selection verse ids must be unique';
  end if;

  select translation.id,
         translation.code,
         translation.can_generate_audio,
         translation.can_stream_audio
  into selected_translation
  from public.scripture_translations as translation
  where translation.code = upper(btrim(p_translation_code))
  for share;

  if not found
    or not selected_translation.can_generate_audio
    or not selected_translation.can_stream_audio then
    raise exception 'translation does not permit generated streaming audio';
  end if;

  select count(*)
  into selected_count
  from public.scripture_verses as verse
  where verse.translation_id = selected_translation.id
    and verse.id = any(p_scripture_verse_ids);
  if selected_count <> cardinality(p_scripture_verse_ids) then
    raise exception 'selection contains an unknown or mismatched canonical verse';
  end if;

  insert into public.audio_verse_assets (
    scripture_verse_id,
    voice_id,
    model_id,
    model_version,
    text_hash
  )
  select verse.id,
         p_voice_id,
         p_model_id,
         p_model_version,
         verse.text_hash
  from public.scripture_verses as verse
  where verse.translation_id = selected_translation.id
    and verse.id = any(p_scripture_verse_ids)
  on conflict (scripture_verse_id, voice_id, model_version, text_hash)
  do nothing;

  insert into public.audio_generation_jobs (audio_verse_asset_id)
  select asset.id
  from public.audio_verse_assets as asset
  join public.scripture_verses as verse
    on verse.id = asset.scripture_verse_id
   and verse.text_hash = asset.text_hash
  where asset.scripture_verse_id = any(p_scripture_verse_ids)
    and asset.voice_id = p_voice_id
    and asset.model_id = p_model_id
    and asset.model_version = p_model_version
    and asset.status = 'pending'
  on conflict (audio_verse_asset_id)
    where status in ('queued', 'processing')
  do nothing;

  select count(*) filter (where asset.status = 'ready'),
         count(*) filter (where asset.status = 'failed')
  into selected_ready, selected_failed
  from public.audio_verse_assets as asset
  join public.scripture_verses as verse
    on verse.id = asset.scripture_verse_id
   and verse.text_hash = asset.text_hash
  where asset.scripture_verse_id = any(p_scripture_verse_ids)
    and asset.voice_id = p_voice_id
    and asset.model_id = p_model_id
    and asset.model_version = p_model_version;

  next_status := case
    when selected_ready = selected_count then 'ready'
    when selected_failed = selected_count then 'failed'
    when selected_failed > 0 then 'partially_failed'
    else 'preparing'
  end;

  insert into public.audio_selections (
    user_id,
    translation_id,
    voice_id,
    selection_hash,
    status,
    total_items,
    ready_items,
    expires_at
  ) values (
    p_user_id,
    selected_translation.id,
    p_voice_id,
    p_selection_hash,
    next_status,
    selected_count,
    selected_ready,
    now() + make_interval(secs => p_expires_in_seconds)
  )
  returning id into created_selection_id;

  insert into public.audio_selection_items (
    audio_selection_id,
    scripture_verse_id,
    audio_verse_asset_id,
    position,
    display_ref
  )
  select created_selection_id,
         requested.verse_id,
         asset.id,
         requested.position::smallint,
         btrim(requested.display_ref)
  from unnest(p_scripture_verse_ids, p_display_refs)
    with ordinality as requested(verse_id, display_ref, position)
  join public.scripture_verses as verse
    on verse.id = requested.verse_id
   and verse.translation_id = selected_translation.id
  join public.audio_verse_assets as asset
    on asset.scripture_verse_id = verse.id
   and asset.voice_id = p_voice_id
   and asset.model_version = p_model_version
   and asset.text_hash = verse.text_hash
  order by requested.position;

  return query
  select created_selection_id, next_status, selected_ready, selected_count;
end;
$$;

create or replace function public.get_audio_selection_status(
  p_selection_id uuid,
  p_user_id uuid
)
returns table (
  selection_id uuid,
  selection_status text,
  ready_count integer,
  total_count integer,
  item_id bigint,
  item_position smallint,
  display_reference text,
  asset_status text,
  storage_path text,
  duration_ms integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_selection record;
  current_ready integer;
  current_failed integer;
  current_status text;
begin
  select selection.id, selection.total_items
  into selected_selection
  from public.audio_selections as selection
  where selection.id = p_selection_id
    and selection.expires_at > now()
    and (selection.user_id is null or selection.user_id = p_user_id)
  for update;
  if not found then
    return;
  end if;

  select count(*) filter (where asset.status = 'ready'),
         count(*) filter (where asset.status = 'failed')
  into current_ready, current_failed
  from public.audio_selection_items as item
  join public.audio_verse_assets as asset
    on asset.id = item.audio_verse_asset_id
  where item.audio_selection_id = p_selection_id;

  current_status := case
    when current_ready = selected_selection.total_items then 'ready'
    when current_failed = selected_selection.total_items then 'failed'
    when current_failed > 0 then 'partially_failed'
    else 'preparing'
  end;

  update public.audio_selections
  set status = current_status,
      ready_items = current_ready
  where id = p_selection_id;

  return query
  select p_selection_id,
         current_status,
         current_ready,
         selected_selection.total_items::integer,
         item.id,
         item.position,
         item.display_ref,
         asset.status,
         asset.storage_path,
         asset.duration_ms
  from public.audio_selection_items as item
  join public.audio_verse_assets as asset
    on asset.id = item.audio_verse_asset_id
  where item.audio_selection_id = p_selection_id
  order by item.position;
end;
$$;

create or replace function public.retry_audio_selection(
  p_selection_id uuid,
  p_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  retry_count integer := 0;
begin
  perform 1
  from public.audio_selections as selection
  where selection.id = p_selection_id
    and selection.expires_at > now()
    and (selection.user_id is null or selection.user_id = p_user_id)
  for update;
  if not found then
    return -1;
  end if;

  with retryable_jobs as (
    select job.id, job.audio_verse_asset_id
    from public.audio_selection_items as item
    join public.audio_verse_assets as asset
      on asset.id = item.audio_verse_asset_id
    join lateral (
      select candidate.id,
             candidate.audio_verse_asset_id,
             candidate.status,
             candidate.attempt_count,
             candidate.max_attempts
      from public.audio_generation_jobs as candidate
      where candidate.audio_verse_asset_id = asset.id
      order by candidate.created_at desc
      limit 1
      for update
    ) as job on true
    where item.audio_selection_id = p_selection_id
      and asset.status = 'failed'
      and job.status = 'failed'
      and job.attempt_count < job.max_attempts
  ), retried_jobs as (
    update public.audio_generation_jobs as job
    set status = 'queued',
        locked_by = null,
        locked_at = null,
        available_at = now(),
        error_code = null,
        error_message = null,
        completed_at = null
    from retryable_jobs
    where job.id = retryable_jobs.id
    returning retryable_jobs.audio_verse_asset_id
  ), retried_assets as (
    update public.audio_verse_assets as asset
    set status = 'pending',
        storage_path = null,
        mime_type = null,
        duration_ms = null,
        error_code = null,
        error_message = null,
        completed_at = null
    from retried_jobs
    where asset.id = retried_jobs.audio_verse_asset_id
    returning asset.id
  )
  select count(*) into retry_count from retried_assets;

  if retry_count > 0 then
    update public.audio_selections
    set status = 'preparing'
    where id = p_selection_id;
  end if;

  return retry_count;
end;
$$;

revoke all on function public.consume_audio_selection_rate_limit(text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.create_audio_selection(
  uuid, text, text, text, text, text, bigint[], text[], integer
) from public, anon, authenticated;
revoke all on function public.get_audio_selection_status(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.retry_audio_selection(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.consume_audio_selection_rate_limit(text, integer, integer)
  to service_role;
grant execute on function public.create_audio_selection(
  uuid, text, text, text, text, text, bigint[], text[], integer
) to service_role;
grant execute on function public.get_audio_selection_status(uuid, uuid)
  to service_role;
grant execute on function public.retry_audio_selection(uuid, uuid)
  to service_role;
