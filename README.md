# TripPot

Friends lock a trip goal with daily save math: invite → goal → daily $X.

Card balance is mock in v1. Post-MVP: Highnote or Unit. No real money.

Repo: https://github.com/Ravid012/project

This app targets **Expo SDK 54** (Expo Go compatible).

## Clone and run

```bash
git clone https://github.com/Ravid012/project.git
cd project
npm install
npx expo start
```

Then open iOS simulator, Android emulator, Expo Go, or the web preview from the Expo CLI.

No API keys needed for the local demo (Zustand + AsyncStorage). Optional env vars are documented in `.env.example`.

Typecheck: `npm run typecheck`

## Demo login

The welcome screen is prefilled:

- Email: `demo@trippot.app`
- Password: `demo`

Flow: create pot → invite code → join → log deposit → daily $X updates.

Apple Sign-In is stubbed for local demo.

## Environment (optional)

Copy `.env.example` to `.env` (or `.env.local`). **Keys are not required** to run the local demo. Zustand + AsyncStorage is the default data layer.

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

When both values are set, `src/lib/supabase.ts` creates a client and the repository adapter in `src/data` selects the Supabase sketch. Screens still use the local store for the MVP loop until remote auth is wired.

Schema (users/profiles, groups, memberships, contributions, invites, mock_spends + RLS sketches) lives in `supabase/migrations/001_init.sql`.

## Notifications

Settings → **Enable daily reminders** asks for permission (once, on tap). TripPot schedules one local 9:00 AM reminder per pot using the daily-target copy:

- on_track: `Deposit $X today`
- past_due: `Trip date passed — $X still to go; Catch up — deposit $X`
- goal_reached: no deposit push

Muted memberships skip reminders. Remote Expo push tokens are saved on the user when a project id exists; delivery is not wired yet.

## Structure

- `src/store.ts` — Zustand + AsyncStorage (default)
- `src/data/` — thin repository + local / Supabase adapters
- `src/lib/supabase.ts` — client stub (null without env keys)
- `src/hooks/useContributionsRealtime.ts` — no-op without keys
- `src/notifications.ts` — permission + local daily reminder
- `src/math.ts` — daily target (past due, goal reached)
- `src/components/MockCard.tsx` — generic preview card
- `app/(auth)/welcome.tsx`
- `app/(app)/` home + spend stub + settings
- `app/group/create.tsx` + `group/[id]/*`
- `app/join/`

## Stubs still remaining

Apple Sign-In (`expo-apple-authentication`), ACH / real funding, Highnote/Unit issuing, remote push send.
