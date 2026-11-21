# HIME STUDIO administrator setup

The admin console is shipped in the app, but administrator access is deliberately **not** granted by choosing a profile role in the client.

## 1. Apply the database migrations

In Supabase Dashboard → SQL Editor, apply the project migrations in timestamp order. In particular, make sure these have been applied:

- `20261121110000_waitlist_reviews_promotions.sql`
- `20261121120000_admin_console.sql`

The earlier calendar, booking-overlap and service-duration migrations must also be applied if they are not already installed.

## 2. Grant administrator access

1. Open Supabase Dashboard → Authentication → Users.
2. Find the account that should administer HIME STUDIO.
3. Copy that account's User UID.
4. Open SQL Editor and run the statement below, replacing the example UUID with the copied UID:

```sql
insert into public.hime_admins (user_id)
values ('00000000-0000-0000-0000-000000000000')
on conflict (user_id) do nothing;
```

To revoke access later:

```sql
delete from public.hime_admins
where user_id = '00000000-0000-0000-0000-000000000000';
```

## 3. Open the admin console

Sign in to the app using the account you enrolled. The **АДМИН** shortcut appears in the top bar. The console includes:

- platform overview and summary counts;
- approval or rejection of master promotion requests;
- hiding and restoring master profiles in the public catalog;
- review moderation and removal of inappropriate reviews;
- a read-only view of recent bookings.

All privileged reads and changes are protected by Supabase Row Level Security and the `hime_is_admin()` database function. The app does not expose an admin-enrollment action to ordinary users.

## Notes

- Promotion approval changes visibility/ranking state; payment processing is not included.
- Master profiles are hidden from the public catalog rather than deleted.
- Review removal is destructive and requires confirmation.
