# HIME STUDIO — draft interaction and motion requirements

This document records requirements for the next UI iteration. Keep all implementation work on `draft/home-redesign-followups`; do not merge into `main` until the owner explicitly approves.

## Motion and transitions
- Use consistent, smooth screen and section transitions.
- Animate navigation, modal/sheet entry and exit, and content appearance without delaying interaction.
- Keep motion subtle and performant; avoid excessive movement.
- Respect `prefers-reduced-motion` and provide reduced/no-motion behavior.

## Functional controls
Every visible button, tab, card action, and interactive control must have a real, testable outcome. No decorative dead buttons.

### Client flows
- Home search and city selection.
- Browse designs, categories, and design details.
- Browse masters, open master profiles, and use available contact/booking actions.
- Profile editing and settings changes, including saving and visible success/error feedback.

### Master flows
- Master cabinet/dashboard, portfolio management, booking actions, and pricing controls.
- Profile and contact editing with persistence and validation feedback.

### Shared navigation
- Home, Designs, Masters, Cabinet, Profile, and Settings must open the correct screens for the current role.
- Back navigation, empty states, loading states, and error states must work.

## Premium subscriptions

Introduce optional paid plans, inspired by the subscription model used by Telegram, with separate benefits for clients and masters and a possible combined plan. Keep core app functions usable for everyone; premium should add convenience, customization, and visibility rather than making basic booking or communication impossible.

### Client Premium
- More saved designs and collections/folders.
- Advanced design filters and personalized recommendations.
- Inspiration boards for collecting designs before an appointment.
- Extra profile customization and premium app themes/badges.
- Optional appointment reminders and calendar conveniences.

### Master Premium
- Enhanced profile and portfolio presentation.
- More portfolio slots and richer service/pricing presentation.
- Booking calendar tools, schedule analytics, and client-management conveniences.
- Profile statistics: views, saves, and booking conversion where measurable.
- Promotional placements or boosts with clear labeling and fair rotation; no guaranteed ranking.
- Additional profile customization and a premium badge.

### HIME Plus (combined)
- Includes the Client Premium and Master Premium benefits for users who need both roles.
- One account can switch between client and master mode without buying two separate subscriptions.

### Subscription rules and safeguards
- Show a clear comparison of Free, Client Premium, Master Premium, and HIME Plus before purchase.
- Do not set prices until costs, target markets, and payment fees are reviewed.
- Explain billing period, renewal, cancellation, and what happens to premium features after expiry.
- Restore purchases and synchronize entitlement status across devices.
- Verify subscription entitlements securely on the backend; never rely only on a client-side premium flag.
- Handle payment failures, refunds, cancellations, and expired subscriptions with clear states.
- Follow the applicable app-store billing rules for in-app digital subscriptions.
- Do not sell better ratings, fake reviews, or undisclosed search ranking. Clearly label paid promotion.
- Keep booking, basic profile visibility, and essential client-master communication available on the free tier.

## Owner admin panel and moderation

Create a separate, owner-only administration area that is not visible to ordinary clients or masters.

### Admin dashboard
- Overview of user accounts, master profiles, designs/photos, bookings, reports, and support requests.
- Search and filter accounts by user ID, username, email, role, and status, with access limited to authorized admin accounts.
- Open a user profile and review relevant public profile information, uploaded content, reports, and moderation history.

### Moderation actions
- Remove or hide an uploaded photo/design that violates the rules.
- Suspend or block an account temporarily or permanently, with a required reason.
- Delete an account only through a deliberate confirmation flow; explain what data will be deleted or retained and handle related bookings, reviews, and legal retention requirements safely.
- Remove or cancel a booking only when policy and the booking state allow it; notify affected parties and record the reason.
- Restore content or accounts when a moderation decision is reversed.
- Provide a clear report reason, evidence/context, status, and action history for each case.

### User reports
- Add a “Report account” action on user and master profiles, and reporting for individual photos/designs and reviews.
- Let the reporter choose a reason and optionally add details; prevent spam with rate limits.
- Create a moderation queue with statuses such as New, In review, Action taken, and Rejected.
- Allow the owner/admin to open a report, inspect the reported item and account, record a decision, and notify the reporter where appropriate.
- Do not automatically block someone solely because a report was submitted.

### Support inbox
- Add an in-app support section where clients and masters can create support tickets and reply in a conversation thread.
- Admin can view, assign, respond to, and close tickets; users can see replies and ticket status.
- Support attachments where safe, with file type/size limits and malware checks.
- Include categories, timestamps, unread indicators, and ticket statuses such as Open, Waiting for user, and Closed.
- Keep support conversations private and accessible only to the requester and authorized support staff.

### Security and accountability
- Enforce admin permissions on the server/database, not just by hiding the admin screen in the app.
- Use role-based access control and a separate owner/admin role; ordinary users must never be able to grant themselves admin rights.
- Require strong authentication for admin access and re-authentication for destructive actions.
- Keep an immutable audit log of admin actions: who acted, what changed, when, and why.
- Use soft deletion or recoverable states where practical; avoid irreversible deletion by accident.
- Protect private user data, minimize what admins can see, and log access to sensitive records.
- Add confirmation dialogs and clear success/error results for every moderation action.

## Acceptance checks
- Test each visible control on both client and master accounts.
- Verify changes persist after leaving and reopening the screen.
- Verify navigation does not lead to blank or placeholder screens.
- Verify animations remain smooth and do not block taps or scrolling.
- Verify reduced-motion behavior.
- Verify premium benefits unlock only for the correct active subscription, restore correctly, and expire/cancel correctly.
- Verify non-admin accounts cannot access admin screens or moderation endpoints, even by direct API requests.
- Verify reports enter the moderation queue, admin decisions are logged, and support replies reach only the correct ticket participants.
- Verify destructive actions require confirmation, record a reason, and can be recovered where supported.
- Run the project's available type checks and Android build before proposing merge.
