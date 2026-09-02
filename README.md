# TripPot (trip-savings)

Friends lock a trip goal with daily save math: invite -> goal -> daily $X.

Card balance is mock in v1. Post-MVP: Highnote or Unit.

Repo: https://github.com/Ravid012/project

## Clone and run

```bash
git clone https://github.com/Ravid012/project.git
cd project
npm install
npx expo start
```

No API keys needed for the local demo (Zustand + AsyncStorage). Optional env vars are documented in `.env.example`.

## Demo login

- Email: `demo@trippot.app`
- Password: `demo`

## Typecheck

```bash
npm run typecheck
# or:
./node_modules/.bin/tsc --noEmit
```

## Core flow

1. Sign in with the demo account (or create a local user).
2. Create a pot (trip goal + date).
3. Share / copy an invite code.
4. Join via invite code.
5. Log a deposit — daily $X target updates from remaining goal / days left.

## Structure

- `src/store.ts` — Zustand + AsyncStorage
- `src/math.ts` — daily target (past due, goal reached)
- `src/types.ts` — shared types
- `src/components/MockCard.tsx` — generic mock card UI
- `app/(auth)/welcome.tsx` — auth / demo login
- `app/(app)/` — home, spend stub, settings
- `app/group/create.tsx` — create pot
- `app/group/[id]/` — pot detail, invite, members, contribute, spend
- `app/join/` — join by invite code

## Stubs

Apple Sign-In, push notifications, real money movement, Highnote/Unit card issuing, and a real backend are not wired yet.

Spec (local workspace): `/workspace/product/MVP-SPEC-v1.md`
