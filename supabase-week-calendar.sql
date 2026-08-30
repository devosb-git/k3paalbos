-- Gedeelde opslag voor de Weekkalender.
-- Voer dit bestand één keer uit in de Supabase SQL Editor.
create table if not exists public.week_calendar_state (
  id integer primary key default 1 check (id = 1),
  state jsonb not null default '{"days":{},"activities":{}}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.week_calendar_state enable row level security;

drop policy if exists "active users can read week calendar" on public.week_calendar_state;
create policy "active users can read week calendar"
on public.week_calendar_state for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.active=true));

drop policy if exists "teachers can insert week calendar" on public.week_calendar_state;
create policy "teachers can insert week calendar"
on public.week_calendar_state for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher'));

drop policy if exists "teachers can update week calendar" on public.week_calendar_state;
create policy "teachers can update week calendar"
on public.week_calendar_state for update to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher'))
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher'));

grant select,insert,update on public.week_calendar_state to authenticated;
