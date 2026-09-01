-- OneScripture Phase 4 durable Kokoro worker contract.
-- Queue state transitions are atomic and executable only by service_role.

create or replace function public.recover_stale_audio_generation_jobs(
  p_lock_timeout_seconds integer default 900
)
returns table (requeued_count integer, failed_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  stale_job record;
  recovered_requeued integer := 0;
  recovered_failed integer := 0;
begin
  if p_lock_timeout_seconds < 60 or p_lock_timeout_seconds > 3600 then
    raise exception 'lock timeout must be between 60 and 3600 seconds';
  end if;

  for stale_job in
    select job.id, job.audio_verse_asset_id, job.attempt_count, job.max_attempts
    from public.audio_generation_jobs as job
    where job.status = 'processing'
      and job.locked_at < now() - make_interval(secs => p_lock_timeout_seconds)
    order by job.locked_at, job.created_at
    for update skip locked
  loop
    if stale_job.attempt_count >= stale_job.max_attempts then
      update public.audio_generation_jobs
      set status = 'failed',
          locked_by = null,
          locked_at = null,
          error_code = 'abandoned_lock',
          error_message = 'Worker lock expired after the final allowed attempt',
          completed_at = now()
      where id = stale_job.id;

      update public.audio_verse_assets
      set status = 'failed',
          storage_path = null,
          mime_type = null,
          duration_ms = null,
          error_code = 'abandoned_lock',
          error_message = 'Worker lock expired after the final allowed attempt',
          completed_at = null
      where id = stale_job.audio_verse_asset_id;

      recovered_failed := recovered_failed + 1;
    else
      update public.audio_generation_jobs
      set status = 'queued',
          locked_by = null,
          locked_at = null,
          available_at = now(),
          error_code = 'abandoned_lock',
          error_message = 'Recovered an expired worker lock',
          completed_at = null
      where id = stale_job.id;

      update public.audio_verse_assets
      set status = 'pending',
          storage_path = null,
          mime_type = null,
          duration_ms = null,
          error_code = null,
          error_message = null,
          completed_at = null
      where id = stale_job.audio_verse_asset_id;

      recovered_requeued := recovered_requeued + 1;
    end if;
  end loop;

  return query select recovered_requeued, recovered_failed;
end;
$$;

create or replace function public.claim_audio_generation_job(
  p_worker_id text,
  p_lock_timeout_seconds integer default 900
)
returns table (
  job_id uuid,
  asset_id uuid,
  attempt_count smallint,
  max_attempts smallint,
  scripture_verse_id bigint,
  voice_id text,
  model_id text,
  model_version text,
  text_hash text,
  canonical_text text,
  translation_code text,
  book_id text,
  chapter smallint,
  verse smallint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if length(btrim(p_worker_id)) < 1 or length(p_worker_id) > 128 then
    raise exception 'worker id must contain 1 to 128 characters';
  end if;

  perform *
  from public.recover_stale_audio_generation_jobs(p_lock_timeout_seconds);

  return query
  with next_job as (
    select job.id
    from public.audio_generation_jobs as job
    join public.audio_verse_assets as asset
      on asset.id = job.audio_verse_asset_id
    join public.scripture_verses as scripture
      on scripture.id = asset.scripture_verse_id
    join public.scripture_translations as translation
      on translation.id = scripture.translation_id
    where job.status = 'queued'
      and job.available_at <= now()
      and job.attempt_count < job.max_attempts
      and asset.status <> 'ready'
      and translation.can_generate_audio
      and translation.can_stream_audio
    order by job.priority, job.created_at
    for update of job skip locked
    limit 1
  ), claimed as (
    update public.audio_generation_jobs as job
    set status = 'processing',
        attempt_count = job.attempt_count + 1,
        locked_by = btrim(p_worker_id),
        locked_at = now(),
        started_at = coalesce(job.started_at, now()),
        completed_at = null,
        error_code = null,
        error_message = null
    from next_job
    where job.id = next_job.id
    returning job.*
  ), generating as (
    update public.audio_verse_assets as asset
    set status = 'generating',
        storage_path = null,
        mime_type = null,
        duration_ms = null,
        error_code = null,
        error_message = null,
        completed_at = null
    from claimed
    where asset.id = claimed.audio_verse_asset_id
    returning asset.*
  )
  select claimed.id,
         generating.id,
         claimed.attempt_count,
         claimed.max_attempts,
         scripture.id,
         generating.voice_id,
         generating.model_id,
         generating.model_version,
         generating.text_hash,
         scripture.text,
         translation.code,
         scripture.book_id,
         scripture.chapter,
         scripture.verse
  from claimed
  join generating on generating.id = claimed.audio_verse_asset_id
  join public.scripture_verses as scripture
    on scripture.id = generating.scripture_verse_id
  join public.scripture_translations as translation
    on translation.id = scripture.translation_id;
end;
$$;

create or replace function public.complete_audio_generation_job(
  p_job_id uuid,
  p_worker_id text,
  p_storage_path text,
  p_duration_ms integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_job record;
begin
  if p_duration_ms < 1 then
    raise exception 'duration must be positive';
  end if;

  select job.id, job.audio_verse_asset_id
  into claimed_job
  from public.audio_generation_jobs as job
  where job.id = p_job_id
    and job.status = 'processing'
    and job.locked_by = btrim(p_worker_id)
  for update;

  if not found then
    raise exception 'job is not owned by this worker';
  end if;

  update public.audio_verse_assets
  set status = 'ready',
      storage_path = p_storage_path,
      mime_type = 'audio/mpeg',
      duration_ms = p_duration_ms,
      error_code = null,
      error_message = null,
      completed_at = now()
  where id = claimed_job.audio_verse_asset_id;

  update public.audio_generation_jobs
  set status = 'completed',
      locked_by = null,
      locked_at = null,
      error_code = null,
      error_message = null,
      completed_at = now()
  where id = claimed_job.id;
end;
$$;

create or replace function public.fail_audio_generation_job(
  p_job_id uuid,
  p_worker_id text,
  p_error_code text,
  p_error_message text,
  p_retryable boolean,
  p_retry_delay_seconds integer default 30
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_job record;
  next_status text;
  safe_error_code text := left(coalesce(nullif(btrim(p_error_code), ''), 'worker_error'), 128);
  safe_error_message text := left(coalesce(nullif(btrim(p_error_message), ''), 'Worker processing failed'), 2000);
begin
  if p_retry_delay_seconds < 0 or p_retry_delay_seconds > 3600 then
    raise exception 'retry delay must be between 0 and 3600 seconds';
  end if;

  select job.id,
         job.audio_verse_asset_id,
         job.attempt_count,
         job.max_attempts
  into claimed_job
  from public.audio_generation_jobs as job
  where job.id = p_job_id
    and job.status = 'processing'
    and job.locked_by = btrim(p_worker_id)
  for update;

  if not found then
    raise exception 'job is not owned by this worker';
  end if;

  if p_retryable and claimed_job.attempt_count < claimed_job.max_attempts then
    next_status := 'queued';

    update public.audio_generation_jobs
    set status = 'queued',
        locked_by = null,
        locked_at = null,
        available_at = now() + make_interval(secs => p_retry_delay_seconds),
        error_code = safe_error_code,
        error_message = safe_error_message,
        completed_at = null
    where id = claimed_job.id;

    update public.audio_verse_assets
    set status = 'pending',
        storage_path = null,
        mime_type = null,
        duration_ms = null,
        error_code = null,
        error_message = null,
        completed_at = null
    where id = claimed_job.audio_verse_asset_id;
  else
    next_status := 'failed';

    update public.audio_generation_jobs
    set status = 'failed',
        locked_by = null,
        locked_at = null,
        error_code = safe_error_code,
        error_message = safe_error_message,
        completed_at = now()
    where id = claimed_job.id;

    update public.audio_verse_assets
    set status = 'failed',
        storage_path = null,
        mime_type = null,
        duration_ms = null,
        error_code = safe_error_code,
        error_message = safe_error_message,
        completed_at = null
    where id = claimed_job.audio_verse_asset_id;
  end if;

  return next_status;
end;
$$;

revoke all on function public.recover_stale_audio_generation_jobs(integer)
  from public, anon, authenticated;
revoke all on function public.claim_audio_generation_job(text, integer)
  from public, anon, authenticated;
revoke all on function public.complete_audio_generation_job(uuid, text, text, integer)
  from public, anon, authenticated;
revoke all on function public.fail_audio_generation_job(uuid, text, text, text, boolean, integer)
  from public, anon, authenticated;

grant execute on function public.recover_stale_audio_generation_jobs(integer)
  to service_role;
grant execute on function public.claim_audio_generation_job(text, integer)
  to service_role;
grant execute on function public.complete_audio_generation_job(uuid, text, text, integer)
  to service_role;
grant execute on function public.fail_audio_generation_job(uuid, text, text, text, boolean, integer)
  to service_role;
