create extension if not exists pgcrypto;

create role anon noinherit;
create role authenticated noinherit;
create role service_role noinherit;

create schema auth;
create table auth.users (
  id uuid primary key,
  created_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select null::uuid;
$$;
