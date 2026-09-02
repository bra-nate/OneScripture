-- Curated public topical scripture collections.
-- Editorial writes are service-only; anonymous and authenticated users may
-- read published topics and their ordered passages.

create table public.scripture_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  status text not null default 'draft',
  display_order smallint not null,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scripture_topics_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint scripture_topics_title_present
    check (length(btrim(title)) between 2 and 80),
  constraint scripture_topics_description_present
    check (length(btrim(description)) between 20 and 240),
  constraint scripture_topics_status
    check (status in ('draft', 'review', 'published', 'archived')),
  constraint scripture_topics_display_order_positive
    check (display_order > 0)
);

create index scripture_topics_public_order_idx
  on public.scripture_topics (is_featured desc, display_order, title)
  where status = 'published';

create trigger scripture_topics_set_updated_at
before update on public.scripture_topics
for each row execute function public.set_updated_at();

create table public.scripture_topic_passages (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null
    references public.scripture_topics (id) on delete cascade,
  translation_id uuid not null
    references public.scripture_translations (id) on delete restrict,
  book_id text not null,
  chapter smallint not null,
  verse_start smallint not null,
  verse_end smallint not null,
  position smallint not null,
  created_at timestamptz not null default now(),
  constraint scripture_topic_passages_reference_order
    check (verse_end >= verse_start),
  constraint scripture_topic_passages_position_positive
    check (position > 0),
  constraint scripture_topic_passages_start_verse_fk
    foreign key (translation_id, book_id, chapter, verse_start)
    references public.scripture_verses (translation_id, book_id, chapter, verse)
    on delete restrict,
  constraint scripture_topic_passages_end_verse_fk
    foreign key (translation_id, book_id, chapter, verse_end)
    references public.scripture_verses (translation_id, book_id, chapter, verse)
    on delete restrict,
  constraint scripture_topic_passages_position_unique
    unique (topic_id, position),
  constraint scripture_topic_passages_reference_unique
    unique (topic_id, translation_id, book_id, chapter, verse_start, verse_end)
);

create index scripture_topic_passages_order_idx
  on public.scripture_topic_passages (topic_id, position);

alter table public.scripture_topics enable row level security;
alter table public.scripture_topic_passages enable row level security;

revoke all on public.scripture_topics from public, anon, authenticated;
revoke all on public.scripture_topic_passages from public, anon, authenticated;
grant select on public.scripture_topics to anon, authenticated;
grant select on public.scripture_topic_passages to anon, authenticated;
grant select, insert, update, delete on public.scripture_topics to service_role;
grant select, insert, update, delete on public.scripture_topic_passages to service_role;

create policy "scripture_topics_public_read"
on public.scripture_topics
for select
to anon, authenticated
using (status = 'published');

create policy "scripture_topic_passages_public_read"
on public.scripture_topic_passages
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.scripture_topics topic
    where topic.id = topic_id
      and topic.status = 'published'
  )
);

-- Replaces one topic and all of its passages in a single transaction. The
-- service role is the only caller, so editorial writes never reach the browser.
create or replace function public.replace_scripture_topic(
  p_slug text,
  p_title text,
  p_description text,
  p_status text,
  p_display_order smallint,
  p_is_featured boolean,
  p_translation_code text,
  p_passages jsonb
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_topic_id uuid;
  v_translation_id uuid;
begin
  if jsonb_typeof(p_passages) <> 'array' or jsonb_array_length(p_passages) = 0 then
    raise exception 'A topic requires at least one passage';
  end if;

  select id into v_translation_id
  from public.scripture_translations
  where code = p_translation_code
    and can_display_text
    and can_generate_audio;

  if v_translation_id is null then
    raise exception 'Translation % is not available for topical audio', p_translation_code;
  end if;

  insert into public.scripture_topics (
    slug,
    title,
    description,
    status,
    display_order,
    is_featured
  ) values (
    p_slug,
    p_title,
    p_description,
    p_status,
    p_display_order,
    p_is_featured
  )
  on conflict (slug) do update set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    display_order = excluded.display_order,
    is_featured = excluded.is_featured
  returning id into v_topic_id;

  delete from public.scripture_topic_passages
  where topic_id = v_topic_id;

  insert into public.scripture_topic_passages (
    topic_id,
    translation_id,
    book_id,
    chapter,
    verse_start,
    verse_end,
    position
  )
  select
    v_topic_id,
    v_translation_id,
    passage.book_id,
    passage.chapter,
    passage.verse_start,
    passage.verse_end,
    passage.position
  from jsonb_to_recordset(p_passages) as passage(
    book_id text,
    chapter smallint,
    verse_start smallint,
    verse_end smallint,
    position smallint
  );

  return v_topic_id;
end;
$$;

revoke all on function public.replace_scripture_topic(
  text,
  text,
  text,
  text,
  smallint,
  boolean,
  text,
  jsonb
) from public, anon, authenticated;
grant execute on function public.replace_scripture_topic(
  text,
  text,
  text,
  text,
  smallint,
  boolean,
  text,
  jsonb
) to service_role;
