-- HIME STUDIO shared backend: profiles, services, portfolio and media storage.
create extension if not exists pgcrypto;

create table if not exists public.master_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  city text not null default '',
  bio text not null default '',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.master_services (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles(id) on delete cascade,
  title text not null,
  price text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles(id) on delete cascade,
  media_path text not null,
  media_type text not null check (media_type in ('image','video')),
  caption text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists master_profiles_city_idx on public.master_profiles (lower(city));
create index if not exists master_services_master_idx on public.master_services (master_id, position);
create index if not exists portfolio_items_master_idx on public.portfolio_items (master_id, created_at desc);

alter table public.master_profiles enable row level security;
alter table public.master_services enable row level security;
alter table public.portfolio_items enable row level security;

drop policy if exists "Public can view master profiles" on public.master_profiles;
create policy "Public can view master profiles" on public.master_profiles for select using (true);
drop policy if exists "Masters manage own profile" on public.master_profiles;
create policy "Masters manage own profile" on public.master_profiles for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Public can view services" on public.master_services;
create policy "Public can view services" on public.master_services for select using (true);
drop policy if exists "Masters manage own services" on public.master_services;
create policy "Masters manage own services" on public.master_services for all using (auth.uid() = master_id) with check (auth.uid() = master_id);

drop policy if exists "Public can view portfolio" on public.portfolio_items;
create policy "Public can view portfolio" on public.portfolio_items for select using (true);
drop policy if exists "Masters manage own portfolio" on public.portfolio_items;
create policy "Masters manage own portfolio" on public.portfolio_items for all using (auth.uid() = master_id) with check (auth.uid() = master_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hime-portfolio', 'hime-portfolio', true, 104857600, array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime'])
on conflict (id) do update set public = true, file_size_limit = 104857600, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view HIME portfolio media" on storage.objects;
create policy "Public can view HIME portfolio media" on storage.objects for select using (bucket_id = 'hime-portfolio');
drop policy if exists "Masters upload own HIME media" on storage.objects;
create policy "Masters upload own HIME media" on storage.objects for insert to authenticated with check (bucket_id = 'hime-portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Masters update own HIME media" on storage.objects;
create policy "Masters update own HIME media" on storage.objects for update to authenticated using (bucket_id = 'hime-portfolio' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'hime-portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Masters delete own HIME media" on storage.objects;
create policy "Masters delete own HIME media" on storage.objects for delete to authenticated using (bucket_id = 'hime-portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
