insert into auth.users (id)
values ('10000000-0000-4000-8000-000000000001');

update public.profiles
set display_name = 'Recovery Drill'
where id = '10000000-0000-4000-8000-000000000001';

insert into public.scripture_translations (
  id,
  code,
  name,
  language_code,
  source_id,
  source_name,
  source_version,
  source_url,
  source_artifact_sha256,
  rights_url,
  attribution,
  can_display_text,
  can_generate_audio,
  can_stream_audio
) values (
  '20000000-0000-4000-8000-000000000001',
  'WEB',
  'World English Bible',
  'en',
  'phase8-recovery',
  'Recovery fixture',
  '1',
  'https://example.invalid/source',
  repeat('a', 64),
  'https://example.invalid/rights',
  'Recovery fixture only',
  true,
  true,
  true
);

insert into public.scripture_verses (
  translation_id,
  book_id,
  chapter,
  verse,
  text,
  text_hash
) values (
  '20000000-0000-4000-8000-000000000001',
  'JHN',
  3,
  16,
  'For God so loved the world.',
  repeat('b', 64)
);

insert into public.playlists (
  id,
  user_id,
  name
) values (
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Recovery playlist'
);
