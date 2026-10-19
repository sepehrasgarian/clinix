# Clinix

**AI competitive-intelligence consultant for clinic owners.** Built for [Build North: Ship Something Real](https://luma.com/build-north) (Oct 16–25, 2026).

Tell Clinix where your clinic is and what you offer. It finds the competing clinics around you, compares services, pricing, reviews and hours, remembers everything across sessions, and gives you a concrete consultation on how to win more patients.

## Stack

| Layer | Tech |
|---|---|
| Mobile app | Expo (React Native, TypeScript) |
| Auth | Clerk |
| Agent memory | SurrealDB (embedded engine, zero setup) |
| AI | Claude (Anthropic API) with web search for competitor discovery |
| API | Node + Hono |

## Repo layout

```
apps/
  mobile/   Expo app (clinic owner UI)
  api/      Hono API: Clerk-verified routes, Claude agent, SurrealDB memory
```

## Run it

```bash
# API
cd apps/api && cp .env.example .env   # add ANTHROPIC_API_KEY, CLERK_SECRET_KEY
npm install && npm run dev            # http://localhost:8787

# Mobile
cd apps/mobile && cp .env.example .env # add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, EXPO_PUBLIC_API_URL
npm install && npx expo start
```

## API

All routes under `/api` need a Clerk bearer token. Without `CLERK_SECRET_KEY` set (local dev), pass `x-user-id: <anything>` instead.

| Method | Route | What it does |
|---|---|---|
| POST | `/api/clinics` | Save the owner's clinic profile (name, type, address, city, services, prices, notes) |
| GET | `/api/clinics` | List the owner's clinics |
| GET | `/api/clinics/:id` | Clinic + stored competitors + past consultations |
| POST | `/api/clinics/:id/analyze` | Run the Claude agent: web-search competitors, write the consultation, store everything in SurrealDB. 1–3 min. |
| POST | `/api/clinics/:id/chat` | Follow-up question to the consultant. Remembers prior turns per clinic. |

Try the agent from the terminal without the app: `cd apps/api && npm run demo` (uses roughly $0.50–$1.50 of Anthropic credit).

## Team

- Sepehr Asgarian
- Rouzbeh Gh ([@RouzbehGh](https://github.com/RouzbehGh))
