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

## Acceptance checks
- Test each visible control on both client and master accounts.
- Verify changes persist after leaving and reopening the screen.
- Verify navigation does not lead to blank or placeholder screens.
- Verify animations remain smooth and do not block taps or scrolling.
- Verify reduced-motion behavior.
- Run the project's available type checks and Android build before proposing merge.
