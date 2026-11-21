-- HIME STUDIO: service duration used by the online booking calendar.
alter table public.master_services
  add column if not exists duration_minutes integer not null default 60,
  add column if not exists is_active boolean not null default true;

alter table public.master_services
  drop constraint if exists master_services_duration_minutes_check;
alter table public.master_services
  add constraint master_services_duration_minutes_check
  check (duration_minutes between 15 and 480);

create index if not exists master_services_active_lookup_idx
  on public.master_services (master_id, is_active, position);
