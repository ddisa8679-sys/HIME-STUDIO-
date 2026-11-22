-- HIME STUDIO: reports, private support inbox, subscription entitlements and admin audit log.
-- Additive migration. It does not delete existing user data or grant admin rights.

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
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.hime_admins a
    where a.user_id = (select auth.uid())
  );
$$;
revoke all on function public.hime_is_admin() from public;
grant execute on function public.hime_is_admin() to authenticated;

create table if not exists public.hime_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete set null,
  target_type text not null check (target_type in ('account','photo','review')),
  target_id text,
  reason text not null check (length(trim(reason)) between 3 and 80),
  details text not null default '' check (length(details) <= 2000),
  status text not null default 'new' check (status in ('new','in_review','action_taken','rejected')),
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists hime_reports_status_created_idx on public.hime_reports(status, created_at desc);
create index if not exists hime_reports_target_user_idx on public.hime_reports(target_user_id);
alter table public.hime_reports enable row level security;
revoke all on public.hime_reports from anon;
grant select, insert on public.hime_reports to authenticated;
grant update on public.hime_reports to authenticated;
drop policy if exists "Users submit reports" on public.hime_reports;
create policy "Users submit reports" on public.hime_reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));
drop policy if exists "Users read own reports" on public.hime_reports;
create policy "Users read own reports" on public.hime_reports
  for select to authenticated using (reporter_id = (select auth.uid()) or public.hime_is_admin());
drop policy if exists "Admins review reports" on public.hime_reports;
create policy "Admins review reports" on public.hime_reports
  for update to authenticated using (public.hime_is_admin()) with check (public.hime_is_admin());

create table if not exists public.hime_support_tickets (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (length(trim(subject)) between 3 and 140),
  category text not null default 'other' check (category in ('account','booking','payment','content','technical','other')),
  status text not null default 'open' check (status in ('open','waiting_for_user','closed')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hime_support_tickets_requester_idx on public.hime_support_tickets(requester_id, updated_at desc);
create table if not exists public.hime_support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.hime_support_tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists hime_support_messages_ticket_idx on public.hime_support_messages(ticket_id, created_at);
alter table public.hime_support_tickets enable row level security;
alter table public.hime_support_messages enable row level security;
revoke all on public.hime_support_tickets, public.hime_support_messages from anon;
grant select, insert on public.hime_support_tickets to authenticated;
grant update on public.hime_support_tickets to authenticated;
grant select, insert on public.hime_support_messages to authenticated;
drop policy if exists "Requester and admins read support tickets" on public.hime_support_tickets;
create policy "Requester and admins read support tickets" on public.hime_support_tickets
  for select to authenticated using (requester_id = (select auth.uid()) or public.hime_is_admin());
drop policy if exists "Users create own support tickets" on public.hime_support_tickets;
create policy "Users create own support tickets" on public.hime_support_tickets
  for insert to authenticated with check (requester_id = (select auth.uid()));
drop policy if exists "Requester and admins update support tickets" on public.hime_support_tickets;
drop policy if exists "Admins update support tickets" on public.hime_support_tickets;
create policy "Admins update support tickets" on public.hime_support_tickets
  for update to authenticated using (public.hime_is_admin()) with check (public.hime_is_admin());
drop policy if exists "Ticket participants read messages" on public.hime_support_messages;
create policy "Ticket participants read messages" on public.hime_support_messages
  for select to authenticated using (
    public.hime_is_admin() or exists (
      select 1 from public.hime_support_tickets t
      where t.id = ticket_id and t.requester_id = (select auth.uid())
    )
  );
drop policy if exists "Ticket participants send messages" on public.hime_support_messages;
create policy "Ticket participants send messages" on public.hime_support_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid()) and (
      public.hime_is_admin() or exists (
        select 1 from public.hime_support_tickets t
        where t.id = ticket_id and t.requester_id = (select auth.uid()) and t.status <> 'closed'
      )
    )
  );
drop policy if exists "Ticket participants update read state" on public.hime_support_messages;

create table if not exists public.hime_subscription_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in ('client_premium','master_premium','hime_plus')),
  status text not null check (status in ('active','grace_period','cancelled','expired','refunded')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  provider text not null,
  provider_reference text,
  updated_at timestamptz not null default now(),
  check (current_period_end > current_period_start)
);
alter table public.hime_subscription_entitlements enable row level security;
revoke all on public.hime_subscription_entitlements from anon, authenticated;
grant select on public.hime_subscription_entitlements to authenticated;
drop policy if exists "Users read own subscription entitlement" on public.hime_subscription_entitlements;
create policy "Users read own subscription entitlement"
  on public.hime_subscription_entitlements for select to authenticated
  using (user_id = (select auth.uid()) or public.hime_is_admin());
-- No client INSERT/UPDATE/DELETE grants: a verified server-side payment webhook must manage entitlements.

create table if not exists public.hime_admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id text,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists hime_admin_audit_created_idx on public.hime_admin_audit_log(created_at desc);
alter table public.hime_admin_audit_log enable row level security;
revoke all on public.hime_admin_audit_log from anon, authenticated;
grant select, insert on public.hime_admin_audit_log to authenticated;
drop policy if exists "Admins read audit log" on public.hime_admin_audit_log;
create policy "Admins read audit log" on public.hime_admin_audit_log
  for select to authenticated using (public.hime_is_admin());
drop policy if exists "Admins append audit log" on public.hime_admin_audit_log;
create policy "Admins append audit log" on public.hime_admin_audit_log
  for insert to authenticated with check (admin_id = (select auth.uid()) and public.hime_is_admin());

