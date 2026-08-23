# Anime RPG Discord

Backend foundation for a professional Discord anime RPG, starting with persistent profiles, character collections, and five-slot teams.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/index.ts` — PostgreSQL source of truth for users, characters, collections, and teams.
- `lib/db/src/seed.ts` — starter character catalog seed.
- `artifacts/api-server/src/services/PhaseOneService.ts` — profile, collection, and team rules.
- `artifacts/api-server/src/routes/phase-one.ts` — validated Phase 1 HTTP endpoints.

## Architecture decisions

- Discord user IDs are stored as text; internal entities use UUIDs so external identifiers never become database primary keys.
- Team updates replace all members inside one transaction and enforce ownership and the five-character limit on the server.
- New profiles receive up to three catalog characters as starters, making the first phase usable before gacha is introduced.
- Database access is explicit: endpoints return `503` when `DATABASE_URL` is absent instead of silently using mock persistence.

## Product

Phase 1 provides profile creation/lookup, a searchable character catalog, starter character collections, and ordered teams with up to five owned characters. Summoning, combat, economy, and progression beyond base ownership are intentionally deferred.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
