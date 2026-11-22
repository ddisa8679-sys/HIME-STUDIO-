# HIME STUDIO draft implementation status

Branch: `draft/home-redesign-followups`

This is an engineering status note, not a claim that the complete roadmap is implemented.

## Already present in the branch
- Client/master navigation and workspace screens.
- Master calendar, working hours, breaks, exceptions, services/pricing, waitlist, bookings, tasks, notifications and favorites UI.
- Master directory, profile details, booking request flow and reviews.
- An owner-only admin workspace with promotion moderation, master visibility controls, review moderation and a recent-bookings view.
- Admin membership is intended to be controlled through the `hime_admins` table, not a client-editable profile field.
- A draft roadmap covering motion, reduced-motion behavior, functional controls and optional Premium tiers.

## Added in this branch
- An additive SQL migration defining user reports, private support tickets/messages, server-managed subscription entitlements and an admin audit log.
- The migration also defines the owner membership table and `hime_is_admin()` authorization helper.

## Not yet complete or verified
- The live Supabase project currently reports only one migration in its migration history. Its public schema currently lacks several tables queried by the app, including the admin/promotion, report, support and subscription tables. Do not treat the branch SQL as deployed.
- The new migration has not been applied to a development database or tested against the live schema.
- Report submission currently covers master accounts only; individual photo/review reporting and reporter-facing report status are not yet wired.
- The admin UI still needs safe booking moderation and an audit-log display. Account suspension is currently an internal HIME moderation status, not a Supabase Auth sign-in ban.
- Permanent account deletion requires a separately secured server-side operation; it must not be implemented as a direct client delete against `auth.users`.
- Premium plan presentation/entitlements are only schema groundwork. No payment provider, store billing, webhook verification, purchase restoration, or production prices are configured.
- Smooth screen transitions, reduced-motion behavior, and every visible control still need device-level QA.
- No successful typecheck or Android build has been run for this branch as part of this work.

## Safe next steps
1. Create a Supabase development branch and apply the repository migrations in order there.
2. Fix migration/schema drift and verify RLS policies and Supabase security advisors.
3. Finish report and support UI for clients, masters and admins.
4. Add server-side moderation actions and audit logging, including secure account suspension/deletion.
5. Integrate a payment provider and app-store billing only after selecting supported markets and legal/payment requirements.
6. Run typecheck, Android build and role-based end-to-end tests before asking to merge.
