# HIME STUDIO administrator setup

The app contains an owner-only administration console. Admin access is granted only by inserting the owner's Auth UID into `public.hime_admins`; choosing a client/master role in the app cannot grant admin rights.

## 1. Apply the database migrations

Apply the SQL migrations in timestamp order. The new admin/reporting/support schema is:

- `20261123100000_reports_support_subscriptions_audit.sql`
- `20261123110000_user_moderation_and_content_admin.sql`

The earlier project migrations for calendar, bookings, reviews and promotions must also be applied first.

Important: Supabase changed Data API exposure defaults in 2026. After applying the migration, open Project Settings → API → Data API and ensure the following tables are included in the exposed schema/API configuration before the mobile client queries them:

- `hime_admins`
- `hime_reports`
- `hime_support_tickets`
- `hime_support_messages`
- `hime_user_moderation`
- `hime_admin_audit_log`
- `hime_subscription_entitlements`

Keep RLS enabled. Do not expose service-role or secret keys to the mobile app.

## 2. Enrol the owner account

1. Open Supabase Dashboard → Authentication → Users.
2. Find the exact account that should administer HIME STUDIO.
3. Copy its User UID.
4. Run this in SQL Editor, replacing the placeholder with that UID:

```sql
insert into public.hime_admins (user_id)
values ('00000000-0000-0000-0000-000000000000')
on conflict (user_id) do nothing;
```

Do not guess the UID or grant admin to a display name/email match.

To revoke access:

```sql
delete from public.hime_admins
where user_id = '00000000-0000-0000-0000-000000000000';
```

## 3. Available admin areas

- Platform overview, masters, promotion requests, reviews and bookings.
- User search and HIME-level moderation status.
- Reports queue with review/resolved/dismissed states.
- Portfolio photo hiding.
- Support inbox and admin replies.
- Subscription records for HIME PREMIUM / HIME PRO.
- Audit log for privileged actions.

## 4. Important boundaries before production

- The current moderation status is an HIME application-level restriction. It does **not** revoke an existing Supabase Auth session or prevent sign-in. A server-side Auth Admin endpoint must be added and security-tested before claiming full account suspension.
- Permanent Auth user deletion is not exposed in the mobile client. It must be performed server-side, with session revocation, audit logging, and a recovery/retention policy.
- Subscription rows are entitlement records only. No payment provider, checkout, recurring billing, cancellation, or refunds are wired yet.
- The admin workspace has a ticket inbox and text replies. User-facing ticket creation, file attachments, push notifications, and realtime delivery still need to be connected.
- Photo moderation hides portfolio entries; deleting Storage objects and moderating the imported nail-design catalog need a separate verified workflow.
- Admin actions must be tested with a non-admin account before release.

The admin console must not be considered production-ready until the migration is applied, the exact owner UID is enrolled, Data API exposure is configured, and the security checks above pass.
