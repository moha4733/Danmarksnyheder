-- Kør én gang i SQL Editor i et nyt Supabase-projekt.
begin;
create table public.nyhedsmarkorer (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nyhed_id text not null,
  titel text not null,
  link text not null,
  sted text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  created_at timestamptz not null default now(),
  unique (user_id, nyhed_id, sted)
);
alter table public.nyhedsmarkorer enable row level security;
revoke all on public.nyhedsmarkorer from anon, authenticated;
grant select, insert, update on public.nyhedsmarkorer to authenticated;
create policy "Laes egne markorer" on public.nyhedsmarkorer
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Opret egne markorer" on public.nyhedsmarkorer
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Opdater egne markorer" on public.nyhedsmarkorer
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
commit;
