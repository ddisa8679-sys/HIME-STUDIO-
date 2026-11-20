-- HIME STUDIO: master scheduling, task lists, favorites and notifications
-- Apply after the existing core schema. All user-owned rows are protected by RLS.

alter table public.bookings
  add column if not exists ends_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists rescheduled_from uuid references public.bookings(id) on delete set null;

create index if not exists bookings_master_starts_idx
  on public.bookings (master_id, starts_at);
create index if not exists bookings_client_starts_idx
  on public.bookings (client_id, starts_at desc);

create table if not exists public.master_working_hours (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles(user_id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  is_working boolean not null default true,
  starts_at time,
  ends_at time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (master_id, weekday),
  check (
    (is_working = false and starts_at is null and ends_at is null)
    or
    (is_working = true and starts_at is not null and ends_at is not null and starts_at < ends_at)
  )
);

create table if not exists public.master_breaks (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles(user_id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  label text not null default 'Перерыв',
  check (starts_at < ends_at)
);
create index if not exists master_breaks_lookup_idx
  on public.master_breaks (master_id, weekday, starts_at);

create table if not exists public.master_schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles(user_id) on delete cascade,
  exception_date date not null,
  is_day_off boolean not null default true,
  starts_at time,
  ends_at time,
  note text not null default '',
  unique (master_id, exception_date),
  check (
    (is_day_off = true and starts_at is null and ends_at is null)
    or
    (is_day_off = false and starts_at is not null and ends_at is not null and starts_at < ends_at)
  )
);

create table if not exists public.master_tasks (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles(user_id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  details text not null default '',
  due_at timestamptz,
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists master_tasks_due_idx
  on public.master_tasks (master_id, is_done, due_at);

create table if not exists public.favorite_masters (
  client_id uuid not null references public.profiles(user_id) on delete cascade,
  master_id uuid not null references public.master_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, master_id),
  check (client_id <> master_id)
);
create index if not exists favorite_masters_master_idx
  on public.favorite_masters (master_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  kind text not null check (kind in (
    'booking_requested','booking_confirmed','booking_cancelled',
    'booking_rescheduled','visit_reminder','review_requested','system'
  )),
  title text not null,
  body text not null default '',
  scheduled_for timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc) where read_at is null;
create index if not exists notifications_scheduled_idx
  on public.notifications (scheduled_for) where scheduled_for is not null;

alter table public.master_working_hours enable row level security;
alter table public.master_breaks enable row level security;
alter table public.master_schedule_exceptions enable row level security;
alter table public.master_tasks enable row level security;
alter table public.favorite_masters enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Working hours public read" on public.master_working_hours;
create policy "Working hours public read" on public.master_working_hours
  for select to anon, authenticated using (true);
drop policy if exists "Masters manage own working hours" on public.master_working_hours;
create policy "Masters manage own working hours" on public.master_working_hours
  for all to authenticated using ((select auth.uid()) = master_id)
  with check ((select auth.uid()) = master_id);

drop policy if exists "Breaks public read" on public.master_breaks;
create policy "Breaks public read" on public.master_breaks
  for select to anon, authenticated using (true);
drop policy if exists "Masters manage own breaks" on public.master_breaks;
create policy "Masters manage own breaks" on public.master_breaks
  for all to authenticated using ((select auth.uid()) = master_id)
  with check ((select auth.uid()) = master_id);

drop policy if exists "Schedule exceptions public read" on public.master_schedule_exceptions;
create policy "Schedule exceptions public read" on public.master_schedule_exceptions
  for select to anon, authenticated using (true);
drop policy if exists "Masters manage own schedule exceptions" on public.master_schedule_exceptions;
create policy "Masters manage own schedule exceptions" on public.master_schedule_exceptions
  for all to authenticated using ((select auth.uid()) = master_id)
  with check ((select auth.uid()) = master_id);

drop policy if exists "Masters manage own tasks" on public.master_tasks;
create policy "Masters manage own tasks" on public.master_tasks
  for all to authenticated using ((select auth.uid()) = master_id)
  with check ((select auth.uid()) = master_id);

drop policy if exists "Clients read own favorites" on public.favorite_masters;
create policy "Clients read own favorites" on public.favorite_masters
  for select to authenticated using ((select auth.uid()) = client_id);
drop policy if exists "Clients add own favorites" on public.favorite_masters;
create policy "Clients add own favorites" on public.favorite_masters
  for insert to authenticated with check ((select auth.uid()) = client_id);
drop policy if exists "Clients remove own favorites" on public.favorite_masters;
create policy "Clients remove own favorites" on public.favorite_masters
  for delete to authenticated using ((select auth.uid()) = client_id);

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select on public.master_working_hours, public.master_breaks, public.master_schedule_exceptions to anon, authenticated;
grant select, insert, update, delete on public.master_working_hours, public.master_breaks, public.master_schedule_exceptions, public.master_tasks, public.favorite_masters to authenticated;
grant select, update on public.notifications to authenticated;
