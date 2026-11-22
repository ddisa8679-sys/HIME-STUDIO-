create table if not exists public.hime_user_moderation (
 user_id uuid primary key references auth.users(id) on delete cascade,
 status text not null check(status in ('active','restricted','suspended')),
 reason text not null,
 updated_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now()
);
alter table public.hime_user_moderation enable row level security;
revoke all on public.hime_user_moderation from anon,authenticated;
grant select on public.hime_user_moderation to authenticated;
grant insert,update on public.hime_user_moderation to authenticated;
drop policy if exists "Admins read moderation statuses" on public.hime_user_moderation;
create policy "Admins read moderation statuses" on public.hime_user_moderation for select to authenticated using(public.hime_is_admin());
drop policy if exists "Admins manage moderation statuses" on public.hime_user_moderation;
create policy "Admins manage moderation statuses" on public.hime_user_moderation for all to authenticated using(public.hime_is_admin()) with check(public.hime_is_admin() and updated_by=(select auth.uid()));
