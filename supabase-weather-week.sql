-- Gedeelde opslag voor de Weer-weekkalender.
-- Eén record per schoolweek (maandag-vrijdag), met de dagvolgorde en gekozen pictogrammen.
create table if not exists public.weather_week_state (
  week_start date primary key,
  state jsonb not null default '{"days":{},"weather":{}}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.weather_week_state enable row level security;

drop policy if exists "authenticated users can read weather week" on public.weather_week_state;
create policy "authenticated users can read weather week"
on public.weather_week_state
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active = true
  )
);

drop policy if exists "teachers can insert weather week" on public.weather_week_state;
create policy "teachers can insert weather week"
on public.weather_week_state
for insert to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active = true and p.role = 'teacher'
  )
);

drop policy if exists "teachers can update weather week" on public.weather_week_state;
create policy "teachers can update weather week"
on public.weather_week_state
for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active = true and p.role = 'teacher'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active = true and p.role = 'teacher'
  )
);

drop policy if exists "teachers can delete weather week" on public.weather_week_state;
create policy "teachers can delete weather week"
on public.weather_week_state
for delete to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active = true and p.role = 'teacher'
  )
);
