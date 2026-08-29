-- Tabel voor de icoontjes die op een dag staan.
create table if not exists calendar_items (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  icon text not null,
  label text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- Voor deze eenvoudige klasversie is de kalender publiek bereikbaar.
-- Later kunnen we dit vervangen door een login/klascode.
alter table calendar_items enable row level security;

drop policy if exists "public read calendar items" on calendar_items;
create policy "public read calendar items"
on calendar_items for select
to anon, authenticated
using (true);

drop policy if exists "public insert calendar items" on calendar_items;
create policy "public insert calendar items"
on calendar_items for insert
to anon, authenticated
with check (true);

drop policy if exists "public update calendar items" on calendar_items;
create policy "public update calendar items"
on calendar_items for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public delete calendar items" on calendar_items;
create policy "public delete calendar items"
on calendar_items for delete
to anon, authenticated
using (true);