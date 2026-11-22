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

## Acceptance checks
- Test each visible control on both client and master accounts.
- Verify changes persist after leaving and reopening the screen.
- Verify navigation does not lead to blank or placeholder screens.
- Verify animations remain smooth and do not block taps or scrolling.
- Verify reduced-motion behavior.
- Verify premium benefits unlock only for the correct active subscription, restore correctly, and expire/cancel correctly.
- Run the project's available type checks and Android build before proposing merge.
