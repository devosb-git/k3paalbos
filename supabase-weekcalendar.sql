-- Database schema for the Weekkalender.
-- The week layout is stored separately from the normal monthly calendar.

create table if not exists week_calendars (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists week_day_placements (
  id uuid primary key default gen_random_uuid(),
  week_calendar_id uuid not null references week_calendars(id) on delete cascade,
  slot integer not null check (slot between 1 and 7),
  day_number integer not null check (day_number between 1 and 7),
  day_name text not null,
  created_at timestamptz not null default now(),
  unique (week_calendar_id, slot),
  unique (week_calendar_id, day_number)
);

create table if not exists week_activities (
  id uuid primary key default gen_random_uuid(),
  week_calendar_id uuid not null references week_calendars(id) on delete cascade,
  weekday integer not null check (weekday between 1 and 7),
  icon text not null,
  label text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists week_activities_calendar_weekday_idx
  on week_activities(week_calendar_id, weekday, position);

alter table week_calendars enable row level security;
alter table week_day_placements enable row level security;
alter table week_activities enable row level security;

create policy if not exists "authenticated read week calendars"
  on week_calendars for select to authenticated using (true);
create policy if not exists "teachers write week calendars"
  on week_calendars for all to authenticated
  using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='teacher' and p.active=true))
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='teacher' and p.active=true));

create policy if not exists "authenticated read week day placements"
  on week_day_placements for select to authenticated using (true);
create policy if not exists "teachers write week day placements"
  on week_day_placements for all to authenticated
  using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='teacher' and p.active=true))
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='teacher' and p.active=true));

create policy if not exists "authenticated read week activities"
  on week_activities for select to authenticated using (true);
create policy if not exists "teachers write week activities"
  on week_activities for all to authenticated
  using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='teacher' and p.active=true))
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='teacher' and p.active=true));
