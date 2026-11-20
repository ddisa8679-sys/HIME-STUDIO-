# HIME STUDIO — Auth setup

The app uses Supabase Auth with email + password and persistent sessions in AsyncStorage.

## Supabase dashboard

1. Open Authentication → URL Configuration.
2. Add `himestudio://auth/callback` to the Redirect URLs allow-list.
3. Keep email confirmation enabled for new accounts.
4. Configure an SMTP provider before production so verification and password-reset messages are delivered reliably. The built-in sender is intended for limited testing.

The client uses only the Supabase project URL and publishable key. Never add a service-role or secret key to the mobile app.

## Local Expo setup

Copy `.env.example` to `.env`. The values in the example are the public project URL and publishable key for HIME STUDIO. Install dependencies with the Expo-compatible package manager, then restart Expo with its cache cleared after changing environment variables.

The app requests the user's real name, email, password, and password confirmation. Email verification is handled through the deep link scheme `himestudio`. Password recovery opens a separate new-password screen. Sessions are persisted and refreshed automatically; closing the app does not sign the user out.

## Current boundary

After authentication, the user chooses Client or Master. That choice is saved to `public.profiles`; master accounts also get a row in `public.master_profiles`. Existing catalog and portfolio screens are still partly demo/local state and are not all backed by Supabase yet.
