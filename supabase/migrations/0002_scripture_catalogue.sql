-- OneScripture Phase 2 scripture catalogue.
-- Canonical text is public-readable only when its translation rights allow it.
-- Writes remain service-role-only because no insert/update/delete policies exist.

create table public.scripture_translations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  language_code text not null,
  source_id text not null,
  source_name text not null,
  source_version text not null,
  source_url text not null,
  source_artifact_sha256 text not null,
  source_published_at date,
  rights_url text not null,
  attribution text not null,
  can_display_text boolean not null default false,
  can_generate_audio boolean not null default false,
  can_stream_audio boolean not null default false,
  can_cache_offline boolean not null default false,
  can_download_audio boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scripture_translations_code_format
    check (code ~ '^[A-Z0-9]{2,16}$'),
  constraint scripture_translations_language_code_format
    check (language_code ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  constraint scripture_translations_source_hash_format
    check (source_artifact_sha256 ~ '^[0-9a-f]{64}$')
);

create table public.scripture_verses (
  id bigint generated always as identity primary key,
  translation_id uuid not null
    references public.scripture_translations (id) on delete restrict,
  book_id text not null,
  chapter smallint not null,
  verse smallint not null,
  text text not null,
  text_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scripture_verses_reference_unique
    unique (translation_id, book_id, chapter, verse),
  constraint scripture_verses_book_id_format
    check (book_id ~ '^(?:[1-3][A-Z]{2}|[A-Z]{3})$'),
  constraint scripture_verses_chapter_positive check (chapter > 0),
  constraint scripture_verses_verse_positive check (verse > 0),
  constraint scripture_verses_text_hash_format
    check (text_hash ~ '^[0-9a-f]{64}$')
);

create index scripture_verses_passage_lookup_idx
  on public.scripture_verses (translation_id, book_id, chapter, verse);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger scripture_translations_set_updated_at
before update on public.scripture_translations
for each row execute function public.set_updated_at();

create trigger scripture_verses_set_updated_at
before update on public.scripture_verses
for each row execute function public.set_updated_at();

alter table public.scripture_translations enable row level security;
alter table public.scripture_verses enable row level security;

revoke insert, update, delete on public.scripture_translations
  from anon, authenticated;
revoke insert, update, delete on public.scripture_verses
  from anon, authenticated;
grant select on public.scripture_translations to anon, authenticated;
grant select on public.scripture_verses to anon, authenticated;

create policy "scripture_translations_public_read"
on public.scripture_translations
for select
to anon, authenticated
using (can_display_text);

create policy "scripture_verses_public_read"
on public.scripture_verses
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.scripture_translations translation
    where translation.id = translation_id
      and translation.can_display_text
  )
);
