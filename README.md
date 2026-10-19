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

## Team

- Sepehr Asgarian
