-- Klastaken: leerlingen, wekelijkse toewijzingen en zonnetje van de week.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.class_students (id uuid primary key default gen_random_uuid(), name text not null, active boolean not null default true, created_at timestamptz not null default now());
create unique index if not exists class_students_name_unique on public.class_students (lower(name));
create table if not exists public.class_task_assignments (id uuid primary key default gen_random_uuid(), week_start date not null, task_key text not null check (task_key in ('first_in_line','schoolbags','jackets','bottles','mail','wipe_table','sweep','empty_compost','water_plants','update_calendar')), slot smallint not null check (slot in (1,2)), student_id uuid not null references public.class_students(id) on delete cascade, task_cycle integer not null default 1, created_at timestamptz not null default now(), created_by uuid references auth.users(id), unique (week_start,task_key,slot));
create table if not exists public.class_week_sunshine (week_start date primary key, student_id uuid not null references public.class_students(id) on delete cascade, sunshine_cycle integer not null default 1, created_at timestamptz not null default now(), created_by uuid references auth.users(id));
create table if not exists public.class_task_settings (id smallint primary key default 1 check(id=1), reset_password_hash text, updated_at timestamptz not null default now(), updated_by uuid references auth.users(id));
insert into public.class_task_settings(id) values(1) on conflict(id) do nothing;

alter table public.class_students enable row level security; alter table public.class_task_assignments enable row level security; alter table public.class_week_sunshine enable row level security; alter table public.class_task_settings enable row level security;
drop policy if exists "active users read class students" on public.class_students; create policy "active users read class students" on public.class_students for select to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true));
drop policy if exists "active users read class task assignments" on public.class_task_assignments; create policy "active users read class task assignments" on public.class_task_assignments for select to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true));
drop policy if exists "active users read class sunshine" on public.class_week_sunshine; create policy "active users read class sunshine" on public.class_week_sunshine for select to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true));
-- Leerlingen wijzigen gebeurt uitsluitend via de wachtwoordbeveiligde RPC.
drop policy if exists "teachers manage class students" on public.class_students;
drop policy if exists "teachers manage class task assignments" on public.class_task_assignments; create policy "teachers manage class task assignments" on public.class_task_assignments for all to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher')) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher'));
drop policy if exists "teachers manage class sunshine" on public.class_week_sunshine; create policy "teachers manage class sunshine" on public.class_week_sunshine for all to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher')) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher'));
drop policy if exists "no direct settings access" on public.class_task_settings;

create or replace function public.class_tasks_password_is_set() returns boolean language plpgsql security definer set search_path=public as $$ begin if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher') then raise exception 'Geen toegang'; end if; return exists(select 1 from public.class_task_settings where id=1 and reset_password_hash is not null); end; $$;

create or replace function public.class_tasks_set_reset_password(p_new_password text) returns boolean language plpgsql security definer set search_path=public,extensions as $$
begin
 if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher') then raise exception 'Geen toegang'; end if;
 if exists(select 1 from public.class_task_settings where id=1 and reset_password_hash is not null) then raise exception 'Er is al een beheerwachtwoord ingesteld'; end if;
 if length(coalesce(p_new_password,''))<4 then raise exception 'Wachtwoord moet minstens 4 tekens bevatten'; end if;
 update public.class_task_settings set reset_password_hash=extensions.crypt(p_new_password,extensions.gen_salt('bf')),updated_at=now(),updated_by=auth.uid() where id=1; return true;
end; $$;

create or replace function public.class_tasks_save_students(p_password text,p_names text[]) returns boolean language plpgsql security definer set search_path=public,extensions as $$
declare v_hash text; v_name text;
begin
 if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher') then raise exception 'Geen toegang'; end if;
 select reset_password_hash into v_hash from public.class_task_settings where id=1;
 if v_hash is null then raise exception 'Beheerwachtwoord is nog niet ingesteld'; end if;
 if extensions.crypt(coalesce(p_password,''),v_hash)<>v_hash then raise exception 'Verkeerd beheerwachtwoord'; end if;
 update public.class_students set active=false where active=true;
 foreach v_name in array coalesce(p_names,array[]::text[]) loop
   v_name:=btrim(v_name); if v_name<>'' then
     insert into public.class_students(name,active) values(v_name,true)
     on conflict ((lower(name))) do update set name=excluded.name,active=true;
   end if;
 end loop; return true;
end; $$;

create or replace function public.class_tasks_reset(p_password text) returns boolean language plpgsql security definer set search_path=public,extensions as $$ declare v_hash text; begin if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher') then raise exception 'Geen toegang'; end if; select reset_password_hash into v_hash from public.class_task_settings where id=1; if v_hash is null then raise exception 'Beheerwachtwoord is nog niet ingesteld'; end if; if extensions.crypt(coalesce(p_password,''),v_hash)<>v_hash then raise exception 'Verkeerd beheerwachtwoord'; end if; delete from public.class_task_assignments where id is not null; delete from public.class_week_sunshine where week_start is not null; return true; end; $$;
create or replace function public.class_tasks_new_school_year(p_password text) returns boolean language plpgsql security definer set search_path=public,extensions as $$ declare v_hash text; begin if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role='teacher') then raise exception 'Geen toegang'; end if; select reset_password_hash into v_hash from public.class_task_settings where id=1; if v_hash is null then raise exception 'Beheerwachtwoord is nog niet ingesteld'; end if; if extensions.crypt(coalesce(p_password,''),v_hash)<>v_hash then raise exception 'Verkeerd beheerwachtwoord'; end if; delete from public.class_task_assignments where id is not null; delete from public.class_week_sunshine where week_start is not null; delete from public.class_students where id is not null; return true; end; $$;

grant execute on function public.class_tasks_password_is_set() to authenticated; grant execute on function public.class_tasks_set_reset_password(text) to authenticated; grant execute on function public.class_tasks_save_students(text,text[]) to authenticated; grant execute on function public.class_tasks_reset(text) to authenticated; grant execute on function public.class_tasks_new_school_year(text) to authenticated;
