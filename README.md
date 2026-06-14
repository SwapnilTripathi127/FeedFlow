# FeedFlow

> Reclaim your Instagram feed. FeedFlow reinforces the content you actually want to see — so your recommendations become signal, not noise.

FeedFlow is a premium control center (mobile app) paired with a Playwright-driven automation engine that gradually retrains Instagram's recommendation system around your declared interests. It's a hackathon-winning MVP, built to ship.

![FeedFlow](./docs/hero.png)

---

## Why FeedFlow

Instagram's discovery feed optimizes for what you _accidentally_ engage with — not what you _want_ to engage with. FeedFlow flips that:

1. **You declare your interests** — AI, Startups, Health, Travel… and the things you don't want (Celebrity gossip, Politics).
2. **FeedFlow operates as you would** — searches relevant hashtags, browses creators, saves and follows judiciously.
3. **Your feed gets better, gradually** — and you can measure it through a personalization score.

The mobile app is the cockpit. The automation engine is the product.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     MOBILE APP (Expo / RN)                     │
│   Onboarding · Dashboard · Preferences · Analytics · Profile   │
└──────────────────────┬─────────────────────────────────────────┘
                       │ HTTPS + JWT (Supabase)
                       ▼
┌────────────────────────────────────────────────────────────────┐
│              API LAYER  (Node · Express · TS)                  │
│   /auth · /profile · /preferences · /instagram · /automation   │
└──────────┬────────────────────────────┬────────────────────────┘
           │                            │
           ▼                            ▼
┌──────────────────────┐    ┌────────────────────────────────────┐
│  SUPABASE (Postgres) │    │   AUTOMATION ENGINE  (Playwright)  │
│  Users · Prefs · IG  │◄───┤   Scheduler · Worker · Sessions    │
│  Jobs · Logs · Stats │    │   Login · Engagement · Analytics   │
└──────────────────────┘    └────────────────────────────────────┘
```

Full architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

---

## Monorepo Layout

```
FeedFlow/
├── apps/
│   ├── mobile/           # Expo · React Native · Expo Router · NativeWind
│   ├── api/              # Express · TypeScript · Supabase admin client
│   └── automation/       # Playwright · session manager · job scheduler
├── packages/
│   └── shared/           # Shared TypeScript types (DTOs, schema)
├── supabase/             # SQL migrations + RLS policies
├── docs/                 # Architecture · Deployment · Design System
├── docker-compose.yml
└── .env.example
```

---

## Quick Start

### Prerequisites

- Node 20+
- pnpm 9+ (`npm i -g pnpm`)
- Supabase project ([create one](https://supabase.com/dashboard))
- Expo CLI (only needed for the mobile app) — bundled via `pnpm`

### 1. Install

```bash
pnpm install
```

### 2. Configure

```bash
cp .env.example .env
# Fill in:
#   SUPABASE_URL
#   SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   API_BASE_URL
```

### 3. Apply database schema

```bash
pnpm db:push          # runs supabase/migrations/*.sql against your project
```

### 4. Run the stack (3 terminals)

```bash
# API server (http://localhost:4000)
pnpm --filter @feedflow/api dev

# Automation worker (consumes the job queue)
pnpm --filter @feedflow/automation dev

# Mobile app (Expo dev server)
pnpm --filter @feedflow/mobile dev
```

Scan the QR code from Expo with the Expo Go app on your phone — or press `i` / `a` for the simulator.

### 5. Run everything via Docker

```bash
docker-compose up --build
```

This brings up the API and automation worker. The mobile app stays on Expo (it's a client).

---

## Tech Stack

| Layer        | Choice                                                |
| ------------ | ----------------------------------------------------- |
| Mobile       | React Native · Expo · Expo Router · TypeScript        |
| Styling      | NativeWind (Tailwind for RN)                          |
| State        | Zustand (UI state) · TanStack Query (server state)    |
| Backend      | Node 20 · Express · TypeScript · Zod                  |
| Database     | Supabase (Postgres) · RLS for tenant isolation        |
| Auth         | Supabase Auth (JWT)                                   |
| Automation   | Playwright (Chromium) · BullMQ-style queue            |
| Deployment   | Docker · Railway / Render / Fly.io / VPS              |

---

## Design System

A premium dark-first design system with a violet/iris primary, designed at the quality bar of Linear, Stripe, and Notion. Tokens live in `apps/mobile/src/theme/`.

See [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) for the full spec.

---

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) — system topology & data flow
- [Deployment](./docs/DEPLOYMENT.md) — Docker, Railway, Render, VPS
- [Design System](./docs/DESIGN_SYSTEM.md) — tokens, components, motion
- [Automation](./docs/AUTOMATION.md) — Playwright engine internals

---

## Legal & Ethics

FeedFlow operates against the user's _own_ account, on the user's behalf, with explicit consent. It does not scrape third-party data, does not impersonate other users, and respects rate limits to avoid both detection and the platform's reasonable expectations. Read the [ethics statement](./docs/ETHICS.md) before deploying.

---

## License

MIT — see [LICENSE](./LICENSE).
