# TripPot (trip-savings)

Friends lock a trip goal with daily save math: invite -> goal -> daily $X.

Card balance is mock in v1. Post-MVP: Highnote or Unit.

## Run

```bash
cd /workspace/trip-savings
npm install
npx expo start
```

Typecheck: `npm run typecheck`

Demo: demo@trippot.app / demo
Flow: create pot -> invite code -> join -> log deposit -> daily $X updates.

## Structure

- `src/store.ts` — Zustand+AsyncStorage
- `src/math.ts` — daily target (past due, goal reached)
- `app/(auth)/welcome.tsx`
- `app/(app)/` home + spend stub + settings
- `app/group/create.tsx` + `group/[id]/*
- `app/join/`
- `src/components/MockCard.tsx` (generic)

## Stubs

Apple Sign-In, push, real money, Highnote/Unit issuing, backend.

Spec: `/workspace/product/MVP-SPEC-v1.md`
