# HIME ADMIN — product draft

Status: planning draft only. Do not merge into main or trigger a production release until explicitly approved.

## Private owner-only admin panel
- Dedicated HIME ADMIN area, accessible only to the designated owner account.
- Enforce authorization on the server/database with role-based access control; hiding UI controls is not security.
- Require strong authentication and re-check permissions for every privileged action.
- Admin overview: users, masters, bookings, reports, support tickets, photos, subscriptions, and basic activity metrics.

## User and profile management
- Search users by supported identifiers and open a moderation view.
- View profile details and relevant report/history context.
- Actions: warn, temporarily suspend, reinstate, or permanently remove an account.
- Require a reason for moderation actions and record actor, timestamp, target, and reason in an audit log.
- Prefer reversible suspension/soft deletion and a defined recovery period over immediate irreversible deletion.
- Provide an appeal/contact path for affected users.

## Photo moderation
- Review uploaded portfolio/catalog photos.
- Remove or hide content that violates published rules; record the reason.
- Preserve moderation history and support restoration where appropriate.
- Do not delete a user's entire profile merely because one photo is reported.

## Booking administration
- Search and inspect bookings.
- Cancel or correct a booking only with appropriate authorization and a recorded reason.
- Notify affected customer and master; retain a booking event history.
- Avoid silently deleting booking/payment records needed for disputes, accounting, or legal retention.

## Reports and complaints
- Add “Report account” and, where relevant, “Report photo/booking”.
- Categories: fraud/scam, harassment, misleading or stolen photos, spam, no-show, other; allow a short explanation and optional evidence.
- Admin queue with statuses: new, reviewing, resolved, dismissed.
- Review evidence and context before action; allow warning, temporary suspension, or account removal according to published rules.
- Rate-limit reports and prevent users from viewing private reporter information.

## Support inbox
- In-app support conversation for customers and masters.
- Users can describe the issue and attach supported images.
- Admin inbox with new / in progress / resolved states, assignment, timestamps, unread indicators, and conversation history.
- Replies should appear in-app and trigger a notification where permitted.
- Keep support access restricted and log administrative access to sensitive conversations.

## Subscription administration
- View HIME PREMIUM / HIME PRO status, plan, renewal state, and entitlement history.
- Support cancellation/refund workflows only through the configured payment provider; never store raw card data.
- Clearly separate subscription management from manual moderation privileges.

## Security, privacy, and operations
- Least-privilege roles; owner-only destructive actions.
- Server-side authorization and database policies for every admin operation.
- Audit log for searches/access to sensitive records and all mutations.
- Confirmation dialogs for destructive actions; soft-delete and recovery window where feasible.
- Data minimization, retention rules, secure attachment handling, abuse/rate limits, and backups.
- Publish clear community rules, complaint handling policy, and support expectations.
- Test unauthorized access, cross-account data access, deletion recovery, notification delivery, and audit logging before release.

## Suggested implementation sequence
1. Define owner identity, admin roles, and authorization policies.
2. Build read-only admin overview and user/report/support queues.
3. Add report intake and moderation actions with audit logging and appeals.
4. Add support messaging and attachment handling.
5. Add booking and photo moderation workflows.
6. Add subscription visibility and provider-backed management.
7. Security review, tests, and staged release.

## Open decisions before implementation
- Confirm the exact owner account identifier; do not grant admin by email/name guesswork.
- Define suspension durations, appeal process, retention/recovery windows, and community rules.
- Confirm payment provider and supported refund/cancellation operations.
- Define support response expectations and attachment limits.
