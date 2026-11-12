-- Permit generated audio for every catalogue translation whose rights flags allow it.
-- The function still validates the translation row and its audio capabilities.

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

