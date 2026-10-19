# Clinix

**AI competitive-intelligence consultant for clinic owners.** Built for [Build North: Ship Something Real](https://luma.com/build-north) (Oct 16–25, 2026).

Tell Clinix where your clinic is and what you offer. It finds the competing clinics around you, compares services, pricing, reviews and hours, remembers everything across sessions, and gives you a concrete consultation on how to win more patients.

## Stack

| Layer | Tech |
|---|---|
| Web app | Next.js (App Router, TypeScript, Tailwind) |
| Auth | Clerk |
| Agent memory | SurrealDB (embedded engine, zero setup) |
| AI | Claude (Anthropic API) with web search for competitor discovery |
| API | Node + Hono |

## Repo layout

```
apps/
  web/      Next.js app (clinic owner UI)
  api/      Hono API: Clerk-verified routes, Claude agent, SurrealDB memory
packages/
  contracts/  Zod schemas + fixtures shared by web and api
```

## Run it

```bash
cp .env.example .env        # fill ANTHROPIC_API_KEY, GOOGLE_PLACES_API_KEY, APIFY_TOKEN, Clerk keys
npm install
npm run dev:api             # http://localhost:8787
npm run dev:web             # http://localhost:3000 (apps/web)
```

## API

All routes under `/api` need a Clerk bearer token. Without `CLERK_SECRET_KEY` set (local dev), pass `x-user-id: <anything>` instead.

| Method | Route | What it does |
|---|---|---|
| POST | `/api/clinics` | Save the owner's clinic (name, address, city, disciplines, services, website, opened) |
| GET | `/api/clinics` | List the owner's clinics |
| GET | `/api/clinics/:id` | Clinic + its analyses |
| POST | `/api/clinics/:id/analyses` | Start the quick scan (finds the Google listing, reads the website, previews the market). Returns 202; poll the analysis. |
| GET | `/api/clinics/:id/analyses/:aid` | Analysis with `stage`, `status` and per-phase progress |
| POST | `/api/clinics/:id/analyses/:aid/services` | Checkpoint 1: confirm services, moves the analysis to discovery |
| POST | `/api/clinics/:id/analyses/:aid/retry` | Retry a failed quick scan |

Analysis `status` values: `queued`, `running`, `awaiting_services`, `awaiting_competitors`, `succeeded`, `failed`. `stage` is `quick_scan`, `discovery` or `deep`.

### Mock endpoints for the web app

No auth, fixture data from `packages/contracts/src/fixtures`. Use these while the pipeline is being finished:

```
GET /api/mock/clinics
GET /api/mock/clinics/:id                 -> { clinic, analyses }
GET /api/mock/clinics/:id/analyses/:aid   -> Analysis (succeeded, all phases done)
GET /api/mock/clinics/:id/report          -> Report (scorecard, competitors, findings, recommendations, ledger, diff)
GET /api/mock/clinics/:id/chat            -> ChatMessage[]
```

In the web app, import types and fixtures directly:

```ts
import type { Report, Finding } from "@clinix/contracts";
import { fixtureReport } from "@clinix/contracts/fixtures";
```

## Development

```bash
npm install                 # once, at the repo root (npm workspaces)
npm run typecheck           # all packages
npm test                    # all packages
npm run dev:api             # http://localhost:8787
```

## Team

- Sepehr Asgarian
- Rouzbeh Gh ([@RouzbehGh](https://github.com/RouzbehGh))
