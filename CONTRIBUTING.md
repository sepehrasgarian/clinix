# Contributing

## Setup

```bash
./dev.sh            # installs, starts API (8787) and web (3000)
./dev.sh --check    # typecheck + tests for every package
```

Secrets live in the repo-root `.env` (gitignored). Keep `.env.example` in sync when you add a variable.

## Code structure

- `apps/api/src`: one layer per folder. `routes/` parse input and call services; `pipeline/` one file per phase plus the runner; `clients/` one file per external service; `db/` one repository per table; `prompts/` builders in TS with text in `prompts/text` and `prompts/disciplines`; `lib/` small pure helpers.
- `apps/web`: `app/` routes, `components/` by screen, `lib/api.ts` for data access, `lib/copy.ts` for every owner-facing string.
- `packages/contracts`: the Zod schemas and the demo fixture shared by both apps. Never redefine a shape elsewhere.
- Files under about 200 lines, functions under about 40. No dead code, no commented-out code.

## Rules that matter to the product

- Owner-facing copy never says "AI" and never names a supplier. English and French only.
- A finding needs two distinct reviews with verbatim quotes; the validator in `apps/api/src/lib/citations.ts` enforces it. Findings that fail are set aside and counted, never deleted.
- Reviewer names and photos are never stored. Never commit `apps/api/data/` or any real clinic data.
- Never recommend price changes in generated text.

## Observability

One structured logger (`apps/api/src/lib/log.ts`, pino) with `LOG_LEVEL` and `LOG_FORMAT` settings. Every request, pipeline phase, model call and external call logs one line with its duration, so a run can be followed end to end from the log. No `console.log` in the API. Interrupted runs are recovered on startup and stale ones are reaped when read.

## Tests

Every change ships with tests: happy path plus one failure path. API tests run against an in-memory database with the model mocked; web tests use Testing Library. `./dev.sh --check` must pass before a commit.

## Commits

Conventional Commits: `type(scope): imperative summary`, with types `feat`, `fix`, `refactor`, `docs`, `chore`, `test` and scopes `api`, `web`, `contracts`, `agent`, `db`, `auth`, `repo`. One logical change per commit. Pull before pushing; never force-push `main`.
