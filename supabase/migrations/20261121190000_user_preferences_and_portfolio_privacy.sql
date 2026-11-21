-- Persist per-user preferences and enforce profile / portfolio visibility.
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_language text not null default 'ru'
    check (preferred_language in ('ru','en','tr','es','de','fr','zh','kk')),
  theme text not null default 'brand' check (theme in ('brand','light','dark')),
  compact_mode boolean not null default false,
  notify_bookings boolean not null default true,
  notify_messages boolean not null default true,
  notify_reminders boolean not null default true,
  notify_marketing boolean not null default false,
  is_profile_public boolean not null default true,
  is_portfolio_public boolean not null default true,
  show_city boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;
create policy "users read own preferences" on public.user_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "users insert own preferences" on public.user_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users update own preferences" on public.user_preferences
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.master_profiles
  add column if not exists show_city boolean not null default true;
alter table public.portfolio_items
  add column if not exists is_public boolean not null default true;

drop policy if exists "portfolio public read" on public.portfolio_items;
create policy "portfolio owner or public visible portfolio read"
  on public.portfolio_items for select to anon, authenticated
  using (
    (select auth.uid()) = master_id
    or (
      is_public = true
      and exists (
        select 1 from public.master_profiles mp
        where mp.user_id = master_id and mp.is_visible = true
      )
    )
  );
