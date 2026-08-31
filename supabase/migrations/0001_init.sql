-- OneScripture Phase 1 schema (per DATA.md): profiles, playlists,
-- playlist_items, downloads, favourites + RLS + profile-on-signup trigger.

-- profiles: extends auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  default_translation text default 'KJV',
  default_language text default 'en',
  created_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  book_id text not null,
  chapter integer not null,
  verse_start integer,
  verse_end integer,
  translation_id text not null,
  display_ref text not null,
  "order" integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  book_id text not null,
  chapter integer not null,
  verse_start integer,
  verse_end integer,
  translation_id text not null,
  display_ref text not null,
  downloaded_at timestamptz not null default now()
);

create table if not exists public.favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id text not null,
  chapter integer not null,
  verse_start integer,
  verse_end integer,
  translation_id text not null,
  display_ref text not null,
  created_at timestamptz not null default now(),
  unique (user_id, book_id, chapter, verse_start, verse_end, translation_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_items enable row level security;
alter table public.downloads enable row level security;
alter table public.favourites enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "playlists_all_own" on public.playlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "playlist_items_all_own" on public.playlist_items
  for all
  using (exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  ));

create policy "downloads_select_own" on public.downloads
  for select using (auth.uid() = user_id);
create policy "downloads_insert_own" on public.downloads
  for insert with check (auth.uid() = user_id);

create policy "favourites_all_own" on public.favourites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
