-- HIME STUDIO: waitlist, photo reviews and moderated master promotions.
create table if not exists public.master_waitlist (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(user_id) on delete cascade,
  master_id uuid not null references public.master_profiles(user_id) on delete cascade,
  service_id uuid references public.master_services(id) on delete set null,
  desired_date date not null,
  preferred_from time,
  preferred_to time,
  client_note text not null default '',
  status text not null default 'waiting' check (status in ('waiting','notified','contacted','booked','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (preferred_from is null or preferred_to is null or preferred_from < preferred_to)
);
create index if not exists master_waitlist_lookup_idx on public.master_waitlist(master_id, desired_date, status);
create index if not exists client_waitlist_lookup_idx on public.master_waitlist(client_id, created_at desc);

alter table public.reviews add column if not exists photo_path text;
create unique index if not exists reviews_one_per_booking_idx on public.reviews(booking_id) where booking_id is not null;

create table if not exists public.master_promotions (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles(user_id) on delete cascade,
  plan text not null default 'featured' check (plan in ('featured','top')),
  city text not null default '',
  starts_on date not null,
  ends_on date not null,
  status text not null default 'pending' check (status in ('pending','active','rejected','expired')),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index if not exists master_promotions_active_idx on public.master_promotions(status, city, starts_on, ends_on);

alter table public.master_waitlist enable row level security;
alter table public.master_promotions enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Clients create own waitlist entries" on public.master_waitlist;
create policy "Clients create own waitlist entries" on public.master_waitlist for insert to authenticated with check (auth.uid() = client_id);
drop policy if exists "Users read own waitlist entries" on public.master_waitlist;
create policy "Users read own waitlist entries" on public.master_waitlist for select to authenticated using (auth.uid() = client_id or auth.uid() = master_id);
drop policy if exists "Masters update own waitlist entries" on public.master_waitlist;
create policy "Masters update own waitlist entries" on public.master_waitlist for update to authenticated using (auth.uid() = master_id) with check (auth.uid() = master_id);
drop policy if exists "Clients cancel own waitlist entries" on public.master_waitlist;
create policy "Clients cancel own waitlist entries" on public.master_waitlist for update to authenticated using (auth.uid() = client_id) with check (auth.uid() = client_id);

drop policy if exists "Public read active master promotions" on public.master_promotions;
create policy "Public read active master promotions" on public.master_promotions for select to anon, authenticated using (status = 'active' and current_date between starts_on and ends_on);
drop policy if exists "Masters read own promotions" on public.master_promotions;
create policy "Masters read own promotions" on public.master_promotions for select to authenticated using (auth.uid() = master_id);
drop policy if exists "Masters request own promotions" on public.master_promotions;
create policy "Masters request own promotions" on public.master_promotions for insert to authenticated with check (auth.uid() = master_id and status = 'pending');
drop policy if exists "Masters update own pending promotions" on public.master_promotions;
create policy "Masters update own pending promotions" on public.master_promotions for update to authenticated using (auth.uid() = master_id and status = 'pending') with check (auth.uid() = master_id and status = 'pending');

drop policy if exists "Public read reviews" on public.reviews;
create policy "Public read reviews" on public.reviews for select to anon, authenticated using (true);
drop policy if exists "Clients create reviews for completed bookings" on public.reviews;
create policy "Clients create reviews for completed bookings" on public.reviews for insert to authenticated with check (
  auth.uid() = client_id and exists (
    select 1 from public.bookings b
    where b.id = booking_id and b.client_id = auth.uid()
      and b.master_id = reviews.master_id and b.status = 'completed'
  )
);

-- Only the owner can upload review images; images are publicly readable with the review.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hime-review-photos','hime-review-photos',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Public read HIME review photos" on storage.objects;
create policy "Public read HIME review photos" on storage.objects for select using (bucket_id = 'hime-review-photos');
drop policy if exists "Clients upload own HIME review photos" on storage.objects;
create policy "Clients upload own HIME review photos" on storage.objects for insert to authenticated with check (bucket_id = 'hime-review-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Clients delete own HIME review photos" on storage.objects;
create policy "Clients delete own HIME review photos" on storage.objects for delete to authenticated using (bucket_id = 'hime-review-photos' and (storage.foldername(name))[1] = auth.uid()::text);

grant select, insert, update on public.master_waitlist to authenticated;
grant select, insert, update on public.master_promotions to authenticated;
grant select, insert on public.reviews to authenticated;
grant select on public.reviews to anon;

-- When a booking is cancelled, alert matching waitlist clients for that date.
create or replace function public.hime_notify_waitlist_on_cancellation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status is distinct from new.status then
    insert into public.notifications(user_id, booking_id, kind, title, body)
    select w.client_id, new.id, 'waitlist_match',
      'Освободилось время у мастера',
      'На ' || to_char(new.starts_at, 'DD.MM.YYYY') || ' появилось свободное время. Открой HIME STUDIO и свяжись с мастером.'
    from public.master_waitlist w
    where w.master_id = new.master_id
      and w.desired_date = (new.starts_at at time zone 'Europe/Moscow')::date
      and w.status = 'waiting'
      and (w.preferred_from is null or (new.starts_at at time zone 'Europe/Moscow')::time >= w.preferred_from)
      and (w.preferred_to is null or (new.starts_at at time zone 'Europe/Moscow')::time < w.preferred_to);
    update public.master_waitlist w set status = 'notified', updated_at = now()
    where w.master_id = new.master_id
      and w.desired_date = (new.starts_at at time zone 'Europe/Moscow')::date
      and w.status = 'waiting'
      and (w.preferred_from is null or (new.starts_at at time zone 'Europe/Moscow')::time >= w.preferred_from)
      and (w.preferred_to is null or (new.starts_at at time zone 'Europe/Moscow')::time < w.preferred_to);
  end if;
  return new;
end;
$$;
drop trigger if exists hime_waitlist_booking_cancelled on public.bookings;
create trigger hime_waitlist_booking_cancelled after update of status on public.bookings
for each row execute function public.hime_notify_waitlist_on_cancellation();

-- Extend the existing notification kind constraint without replacing other kinds.
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
check (kind in ('booking_requested','booking_confirmed','booking_cancelled','booking_rescheduled','visit_reminder','review_requested','system','waitlist_match'));
