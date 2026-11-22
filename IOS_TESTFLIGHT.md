# iOS / TestFlight setup

The project now has an iOS bundle identifier (`com.himestudio.app`) and an EAS production profile for App Store Connect / TestFlight. Android settings remain unchanged.

## Requirements

- An Expo account: https://expo.dev/signup
- An active Apple Developer Program membership and App Store Connect access. TestFlight distribution requires the paid membership.
- Access to the Apple Account that can create signing certificates and provisioning profiles (normally the Account Holder for an individual team).
- The TestFlight app installed on the iPhone.

## Build and upload

From the repository root:

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

The first EAS setup may ask to create/link an Expo project and write its `extra.eas.projectId` into `app.json`. Keep that generated ID in the repository. During signing, EAS can create the required Apple distribution certificate and provisioning profile after the authorized Apple account signs in. The first submission may ask for App Store Connect access and app metadata.

Alternatively, build and submit separately:

```bash
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --latest
```

## Install from TestFlight

1. Wait for Apple to finish processing the uploaded build in App Store Connect.
2. In App Store Connect, open HIME STUDIO → TestFlight.
3. Add yourself to an Internal Testing group (or configure External Testing and complete Apple's beta review).
4. Accept the invitation on the iPhone, open it in TestFlight, and tap Install.

TestFlight builds expire after 90 days. External testers require Apple's beta review; internal testers must be members of the App Store Connect team.

## Important project checks before inviting testers

- Set up the production Supabase project and confirm Authentication redirect URL `himestudio://auth/callback`.
- Verify the app's real-device flows (sign-up, email verification, password recovery, photo-library access, and session persistence).
- The current project notes that some catalog and portfolio screens still use demo/local state; review those before presenting the app as production-ready.
- Never put Supabase service-role or other secret keys in the mobile app. Only the public client key belongs in Expo public environment variables.

## Notes

The EAS build runs in Expo's cloud, so a Mac is not required for the build/upload workflow. This configuration prepares the project; it does not itself create an Apple-signed IPA or upload a build. That requires the Expo and Apple account steps above.
