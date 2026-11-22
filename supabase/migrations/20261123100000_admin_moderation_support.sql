-- HIME STUDIO: administration, reports, support and subscription records.
-- This migration is committed to the draft branch only. Apply to hosted Supabase
-- only after the owner account has been identified and reviewed.

create table if not exists public.hime_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.hime_admins enable row level security;
revoke all on public.hime_admins from anon, authenticated;
grant select on public.hime_admins to authenticated;
drop policy if exists "HIME admins read own membership" on public.hime_admins;
create policy "HIME admins read own membership"
  on public.hime_admins for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.hime_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.hime_admins a
    where a.user_id = (select auth.uid())
  );
$$;
revoke all on function public.hime_is_admin() from public, anon;
grant execute on function public.hime_is_admin() to authenticated;

create table if not exists public.hime_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete set null,
  target_type text not null check (target_type in ('account','photo','booking','review')),
  target_record_id uuid,
  category text not null check (category in ('fraud','harassment','fake_photos','spam','no_show','other')),
  details text not null default '',
  status text not null default 'new' check (status in ('new','reviewing','resolved','dismissed')),
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hime_reports enable row level security;
grant select, insert on public.hime_reports to authenticated;
grant update on public.hime_reports to authenticated;
drop policy if exists "Users create own reports" on public.hime_reports;
create policy "Users create own reports" on public.hime_reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));
drop policy if exists "Users read own reports" on public.hime_reports;
create policy "Users read own reports" on public.hime_reports
  for select to authenticated using (reporter_id = (select auth.uid()));
drop policy if exists "Admins manage reports" on public.hime_reports;
create policy "Admins manage reports" on public.hime_reports
  for all to authenticated using (public.hime_is_admin())
  with check (public.hime_is_admin());

create table if not exists public.hime_support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null default 'Обращение в поддержку',
  status text not null default 'new' check (status in ('new','in_progress','resolved')),
  assigned_admin uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hime_support_conversations enable row level security;
grant select, insert on public.hime_support_conversations to authenticated;
grant update on public.hime_support_conversations to authenticated;
drop policy if exists "Users create own support conversations" on public.hime_support_conversations;
create policy "Users create own support conversations" on public.hime_support_conversations
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users read own support conversations" on public.hime_support_conversations;
create policy "Users read own support conversations" on public.hime_support_conversations
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Admins manage support conversations" on public.hime_support_conversations;
create policy "Admins manage support conversations" on public.hime_support_conversations
  for all to authenticated using (public.hime_is_admin())
  with check (public.hime_is_admin());

create table if not exists public.hime_support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.hime_support_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  attachment_path text,
  created_at timestamptz not null default now(),
  constraint hime_support_message_has_content check (length(trim(body)) > 0 or attachment_path is not null)
);
alter table public.hime_support_messages enable row level security;
grant select, insert on public.hime_support_messages to authenticated;
drop policy if exists "Participants read support messages" on public.hime_support_messages;
create policy "Participants read support messages" on public.hime_support_messages
  for select to authenticated using (
    sender_id = (select auth.uid())
    or exists (
      select 1 from public.hime_support_conversations c
      where c.id = conversation_id
        and (c.user_id = (select auth.uid()) or public.hime_is_admin())
    )
  );
drop policy if exists "Users and admins send support messages" on public.hime_support_messages;
create policy "Users and admins send support messages" on public.hime_support_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.hime_support_conversations c
      where c.id = conversation_id
        and (c.user_id = (select auth.uid()) or public.hime_is_admin())
    )
  );

create table if not exists public.hime_user_moderation (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','suspended','restricted')),
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

create table if not exists public.hime_admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id text not null,
  reason text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.hime_admin_audit_log enable row level security;
revoke all on public.hime_admin_audit_log from anon, authenticated;
grant select, insert on public.hime_admin_audit_log to authenticated;
drop policy if exists "Admins read audit log" on public.hime_admin_audit_log;
create policy "Admins read audit log" on public.hime_admin_audit_log
  for select to authenticated using (public.hime_is_admin());
drop policy if exists "Admins write audit log" on public.hime_admin_audit_log;
create policy "Admins write audit log" on public.hime_admin_audit_log
  for insert to authenticated with check (admin_id = (select auth.uid()) and public.hime_is_admin());

create table if not exists public.hime_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('premium_client','pro_master','premium_all')),
  status text not null default 'pending' check (status in ('pending','active','cancelled','expired','past_due')),
  provider text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hime_subscriptions enable row level security;
grant select on public.hime_subscriptions to authenticated;
drop policy if exists "Users read own subscriptions" on public.hime_subscriptions;
create policy "Users read own subscriptions" on public.hime_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Admins read subscriptions" on public.hime_subscriptions;
create policy "Admins read subscriptions" on public.hime_subscriptions
  for select to authenticated using (public.hime_is_admin());

-- Admin-only read/moderation access to existing app data.
grant select, update on public.profiles to authenticated;
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

grant select, update on public.master_profiles to authenticated;
drop policy if exists "HIME admins read all master profiles" on public.master_profiles;
create policy "HIME admins read all master profiles" on public.master_profiles
  for select to authenticated using (public.hime_is_admin());
drop policy if exists "HIME admins update master visibility" on public.master_profiles;
create policy "HIME admins update master visibility" on public.master_profiles
  for update to authenticated using (public.hime_is_admin())
  with check (public.hime_is_admin());

grant select, update on public.master_promotions to authenticated;
drop policy if exists "HIME admins read all promotions" on public.master_promotions;
create policy "HIME admins read all promotions" on public.master_promotions
  for select to authenticated using (public.hime_is_admin());
drop policy if exists "HIME admins moderate promotions" on public.master_promotions;
create policy "HIME admins moderate promotions" on public.master_promotions
  for update to authenticated using (public.hime_is_admin())
  with check (public.hime_is_admin());

grant select, delete on public.reviews to authenticated;
drop policy if exists "HIME admins read all reviews" on public.reviews;
create policy "HIME admins read all reviews" on public.reviews
  for select to authenticated using (public.hime_is_admin());
drop policy if exists "HIME admins remove reviews" on public.reviews;
create policy "HIME admins remove reviews" on public.reviews
  for delete to authenticated using (public.hime_is_admin());
