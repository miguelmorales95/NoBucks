# Clover 🍀

A hyperlocal, cashless community app for LA neighborhoods, styled cozy like Animal Crossing.
Neighbors trade skills, time, and goods for **sprouts** (≈ 1 sprout per hour), and everyone you
trade with moves into your little animated **village**.

This is the real codebase (React + TypeScript + Vite), ported from the earlier clickable prototype.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173). It also serves on your local
network, so you can open it on your phone at `http://<your-computer-ip>:5173`.

Other scripts:

- `npm run build` – production bundle into `dist/`
- `npm run preview` – serve the production build
- `npm run typecheck` – run the TypeScript compiler without emitting

## Stack & why

- **React 18 + Vite + TypeScript** — a responsive web app that runs on phone and desktop
  browsers today, installable as a PWA later. Fastest real foundation for "phone and web."
- When you want store-published native iOS/Android apps, the move is **Expo / React Native**.
  The component and state structure here (screens, a store, presentational components) ports
  over cleanly — the main swap is the view layer and the SVG rendering.

## How it's organized

```
src/
  main.tsx            app entry
  App.tsx             routes by onboarding stage, then by bottom-nav tab
  store.tsx           all app state + actions (one place; swap for an API later)
  types.ts            shared types
  data.ts             seed listings, categories, character palettes, distance config
  character.tsx       the human/animal character renderer + look helpers
  styles.css          design tokens (light + dark) and every component style
  components/         Header, BottomNav, Toast, SheetHost (bottom sheets),
                      CharacterBuilder, VillageScene (animated), listing cards
  screens/            Auth, Verify, Create, Village, Explore, Pacts, Post, Chats
```

### State

`src/store.tsx` holds everything in one place behind a React context (`useStore()`), with a
flat set of `actions`. This is deliberately the single integration point: when you add a real
backend, replace the bodies of those actions with API calls and the UI barely changes.

### The exchange flow (matches the design doc)

discover → **message** to arrange → **reserve** sprouts (escrow) → both **complete** → **rate**.
Ratings are only possible *after* a completed trade (see `completeTrade` → rating sheet).

### Onboarding

sign in → **verify you're a real human** (inclusive: any ID, selfie, vouching, or phone+address)
→ **build a villager** (human or animal) → land in your **Village**.

## Backend (`/server`)

A deployable API lives in [`server/`](server/): **Node + TypeScript + Express + Prisma** on
**PostgreSQL**, built for **AWS** (RDS/Aurora for the DB, S3 for photos, Cognito for auth/social,
SNS/Web Push for notifications, App Runner or ECS Fargate for the API). It covers accounts,
verification, listings, photo uploads, messaging, the sprout economy with escrow + an auditable
ledger, ratings, the village, moderation, and notifications. See [`server/README.md`](server/README.md)
for local setup and AWS deployment steps.

The web app currently runs on the in-memory store in [`src/store.tsx`](src/store.tsx).
[`src/api.ts`](src/api.ts) is a typed client for the backend; going live means replacing the store's
action bodies with those calls and setting `VITE_API_URL` (see `.env.example`).

## Notes / what's mocked

- Sign-in and verification are **mocked** (no backend yet). Any button proceeds.
- Data is in-memory and resets on refresh. No persistence or network yet.
- Off-app villagers are a private, visual keepsake — not shown to anyone else.
- Rides/driving are intentionally excluded for liability; car *repair* stays.

See `Clover Design Doc` (Claude Doc) for the full product thinking and open questions.
