-- Gebruikersprofielen en rollen.
-- Wachtwoorden staan NIET in deze tabel; Supabase Auth beheert die.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'parent' check (role in ('teacher','parent')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.calendar_items enable row level security;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile" on public.profiles
for select to authenticated using (auth.uid() = id);

drop policy if exists "authenticated users can read calendar" on public.calendar_items;
create policy "authenticated users can read calendar" on public.calendar_items
for select to authenticated using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.active=true)
);

drop policy if exists "teachers can insert calendar" on public.calendar_items;
create policy "teachers can insert calendar" on public.calendar_items
for insert to authenticated with check (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher')
);

drop policy if exists "teachers can update calendar" on public.calendar_items;
create policy "teachers can update calendar" on public.calendar_items
for update to authenticated using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher')
) with check (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher')
);

drop policy if exists "teachers can delete calendar" on public.calendar_items;
create policy "teachers can delete calendar" on public.calendar_items
for delete to authenticated using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher')
);

-- 1. Maak eerst de juf aan via Supabase Dashboard > Authentication > Users.
-- 2. Kopieer daarna haar User ID (UUID).
-- 3. Vul die UUID hieronder in en voer uit:
-- insert into public.profiles (id, display_name, role) values ('JOUW-USER-UUID','Juf','teacher');

-- Toekomstige ouder (read-only):
-- insert into public.profiles (id, display_name, role) values ('OUDER-USER-UUID','Mama/Papa','parent');
