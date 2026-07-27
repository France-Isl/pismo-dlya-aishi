-- GlowLetter cloud progress baseline.
-- The application stores only compact preferences here; personal photos,
-- audio, pasted messages, coordinates, and beta capabilities stay local.

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

create table public.glowletter_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version smallint not null default 1
    check (schema_version between 1 and 100),
  sender_name varchar(36) not null default '',
  recipient_name varchar(36) not null default '',
  language text not null default 'ru'
    check (language in ('ru', 'en', 'fr')),
  current_letter_id smallint not null default 1
    check (current_letter_id between 1 and 50),
  favorite_ids smallint[] not null default '{}'::smallint[]
    check (cardinality(favorite_ids) <= 50),
  rain_enabled boolean not null default true,
  weather_enabled boolean not null default false,
  built_in_track smallint not null default 0
    check (built_in_track between 0 and 2),
  nature_enabled boolean not null default false,
  fullscreen_enabled boolean not null default false,
  volume real not null default 0.62
    check (volume between 0 and 1),
  revision bigint not null default 0
    check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.glowletter_progress is
  'Private per-user GlowLetter names, reading progress, favorites, and atmosphere preferences.';

alter table public.glowletter_progress enable row level security;

revoke all on table public.glowletter_progress from public, anon, authenticated;
grant select, insert, update, delete
  on table public.glowletter_progress to authenticated;
grant select, insert, update, delete
  on table public.glowletter_progress to service_role;

create policy "Users can read only their GlowLetter progress"
  on public.glowletter_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create only their GlowLetter progress"
  on public.glowletter_progress
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update only their GlowLetter progress"
  on public.glowletter_progress
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete only their GlowLetter progress"
  on public.glowletter_progress
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Future API objects remain private until a migration grants them explicitly.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables
  from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences
  from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions
  from public, anon, authenticated, service_role;

notify pgrst, 'reload schema';
