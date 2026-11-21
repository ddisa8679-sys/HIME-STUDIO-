-- HIME STUDIO: secure administrator access and moderation policies.
-- Admins are enrolled manually by a trusted project owner in Supabase SQL Editor.
-- No client-side profile update can grant administrator access.

create table if not exists public.hime_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.hime_admins enable row level security;
revoke all on public.hime_admins from anon, authenticated;
grant select on public.hime_admins to authenticated;

drop policy if exists "Admins can read own admin membership" on public.hime_admins;
create policy "Admins can read own admin membership"
  on public.hime_admins for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.hime_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.hime_admins a
    where a.user_id = (select auth.uid())
  );
$$;
revoke all on function public.hime_is_admin() from public;
grant execute on function public.hime_is_admin() to authenticated;

-- Admin read access for the moderation workspace.
drop policy if exists "HIME admins read all master profiles" on public.master_profiles;
create policy "HIME admins read all master profiles"
  on public.master_profiles for select to authenticated
  using (public.hime_is_admin());
drop policy if exists "HIME admins update master visibility" on public.master_profiles;
create policy "HIME admins update master visibility"
  on public.master_profiles for update to authenticated
  using (public.hime_is_admin())
  with check (public.hime_is_admin());

drop policy if exists "HIME admins read all promotions" on public.master_promotions;
create policy "HIME admins read all promotions"
  on public.master_promotions for select to authenticated
  using (public.hime_is_admin());
drop policy if exists "HIME admins moderate promotions" on public.master_promotions;
create policy "HIME admins moderate promotions"
  on public.master_promotions for update to authenticated
  using (public.hime_is_admin())
  with check (public.hime_is_admin());

drop policy if exists "HIME admins read all reviews" on public.reviews;
create policy "HIME admins read all reviews"
  on public.reviews for select to authenticated
  using (public.hime_is_admin());
drop policy if exists "HIME admins remove reviews" on public.reviews;
create policy "HIME admins remove reviews"
  on public.reviews for delete to authenticated
  using (public.hime_is_admin());

drop policy if exists "HIME admins read all waitlist entries" on public.master_waitlist;
create policy "HIME admins read all waitlist entries"
  on public.master_waitlist for select to authenticated
  using (public.hime_is_admin());

drop policy if exists "HIME admins read all bookings" on public.bookings;
create policy "HIME admins read all bookings"
  on public.bookings for select to authenticated
  using (public.hime_is_admin());

grant select, update on public.master_profiles to authenticated;
grant select, update on public.master_promotions to authenticated;
grant select, delete on public.reviews to authenticated;
grant select on public.master_waitlist to authenticated;
grant select on public.bookings to authenticated;
