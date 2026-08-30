-- Handmatig blauw gemarkeerde kalenderdagen (feestdagen / vrije dagen).
create table if not exists public.calendar_blue_days (
  day date primary key,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.calendar_blue_days enable row level security;

drop policy if exists "authenticated users can read blue calendar days" on public.calendar_blue_days;
create policy "authenticated users can read blue calendar days" on public.calendar_blue_days
for select to authenticated using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active = true
  )
);

drop policy if exists "teachers can insert blue calendar days" on public.calendar_blue_days;
create policy "teachers can insert blue calendar days" on public.calendar_blue_days
for insert to authenticated with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active = true and p.role = 'teacher'
  )
  and created_by = auth.uid()
);

drop policy if exists "teachers can delete blue calendar days" on public.calendar_blue_days;
create policy "teachers can delete blue calendar days" on public.calendar_blue_days
for delete to authenticated using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active = true and p.role = 'teacher'
  )
);
