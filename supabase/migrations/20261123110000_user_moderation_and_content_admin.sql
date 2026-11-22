-- HIME STUDIO: reversible HIME-level account moderation and admin access to content.
-- The Supabase Auth ban/delete API remains server-side and is intentionally separate.

create table if not exists public.hime_user_moderation (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','restricted','suspended')),
  reason text not null default '',
  suspended_until timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.hime_user_moderation enable row level security;
revoke all on public.hime_user_moderation from anon, authenticated;
grant select, insert, update on public.hime_user_moderation to authenticated;
drop policy if exists "Admins manage user moderation" on public.hime_user_moderation;
create policy "Admins manage user moderation" on public.hime_user_moderation
  for all to authenticated using (public.hime_is_admin())
  with check (public.hime_is_admin());

grant select on public.profiles to authenticated;
drop policy if exists "HIME admins read profiles" on public.profiles;
create policy "HIME admins read profiles" on public.profiles
  for select to authenticated using (public.hime_is_admin());

grant select, update on public.portfolio_items to authenticated;
drop policy if exists "HIME admins read portfolio" on public.portfolio_items;
create policy "HIME admins read portfolio" on public.portfolio_items
  for select to authenticated using (public.hime_is_admin());
drop policy if exists "HIME admins moderate portfolio" on public.portfolio_items;
create policy "HIME admins moderate portfolio" on public.portfolio_items
  for update to authenticated using (public.hime_is_admin())
  with check (public.hime_is_admin());

grant select, update on public.nail_designs to authenticated;
drop policy if exists "HIME admins manage nail designs" on public.nail_designs;
create policy "HIME admins manage nail designs" on public.nail_designs
  for all to authenticated using (public.hime_is_admin())
  with check (public.hime_is_admin());

grant select, update on public.bookings to authenticated;
drop policy if exists "HIME admins read bookings" on public.bookings;
create policy "HIME admins read bookings" on public.bookings
  for select to authenticated using (public.hime_is_admin());
drop policy if exists "HIME admins update bookings" on public.bookings;
create policy "HIME admins update bookings" on public.bookings
  for update to authenticated using (public.hime_is_admin())
  with check (public.hime_is_admin());
