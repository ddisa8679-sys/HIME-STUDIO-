-- HIME STUDIO: prevent overlapping active bookings.
-- Serialize writes per master, then reject any intersecting pending/confirmed interval.
create or replace function public.hime_guard_booking_overlap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conflicting_booking uuid;
begin
  if new.starts_at is null then
    raise exception 'Booking start time is required' using errcode = '22007';
  end if;

  new.ends_at := coalesce(new.ends_at, new.starts_at + interval '60 minutes');
  if new.ends_at <= new.starts_at then
    raise exception 'Booking end must be after start' using errcode = '22007';
  end if;

  if new.status in ('pending', 'confirmed') then
    perform pg_advisory_xact_lock(hashtextextended(new.master_id::text, 0));

    select b.id
      into conflicting_booking
      from public.bookings b
     where b.master_id = new.master_id
       and b.id is distinct from new.id
       and b.status in ('pending', 'confirmed')
       and tstzrange(
             b.starts_at,
             coalesce(b.ends_at, b.starts_at + interval '60 minutes'),
             '[)'
           ) && tstzrange(new.starts_at, new.ends_at, '[)')
     limit 1;

    if conflicting_booking is not null then
      raise exception 'This time is already booked'
        using errcode = '23P01',
              detail = 'Choose another available time slot.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists hime_booking_overlap_guard on public.bookings;
create trigger hime_booking_overlap_guard
before insert or update of master_id, starts_at, ends_at, status
on public.bookings
for each row
execute function public.hime_guard_booking_overlap();
