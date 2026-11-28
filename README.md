# Junk Removal Website

Marketing site + (later) admin dashboard for a Greater Boston junk removal business,
built per `PRD.md` and `ARCHITECTURE.md`. Progress is tracked in `TODO.md`.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 3.4 (+ shadcn/ui components from the design-system task)
- Prisma 7 + PostgreSQL on Neon (node-postgres driver adapter)
- React Hook Form + Zod
- Resend (email), Upstash Redis (rate limiting)
- Vitest (unit + integration tests)
- Vercel hosting
- Later phases: Cloudflare R2 (Phase 3), Auth.js + Twilio (Phase 4)

## Structure
```
prisma/schema.prisma      Data model — tables are added phase by phase (see ARCHITECTURE.md "Data model")
prisma/migrations/        Prisma Migrate history (applied on Vercel by `vercel-build`)
prisma.config.ts          Prisma CLI config (migration connection URL)
src/app/                  Pages + route handlers (App Router)
src/app/api/leads/        POST /api/leads — quote request intake (Phase 1, task 8)
src/lib/                  Shared server utilities (Prisma client, validation schemas)
src/generated/prisma/     Generated Prisma client (gitignored, built by `prisma generate`)
tests/schema/             Schema/migration checks (no database needed)
tests/integration/        Tests that need a database (skipped without DATABASE_URL;
                          write tests run only against a local DB or ALLOW_DB_WRITE_TESTS=true)
.github/workflows/ci.yml  CI: validate schema, migrate, typecheck, lint, test, build
```

## Requirements
- Node.js 20.19+, 22.12+ or 24 LTS (Vercel runs Node 24; use an LTS locally if possible)
- A Postgres database — a Neon branch for development is the documented setup

## Getting started
1. `cp .env.example .env` and set `DATABASE_URL` (Neon **pooled** connection string)
   and `DATABASE_URL_UNPOOLED` (Neon **direct** connection string).
2. `npm install` (also generates the Prisma client)
3. `npm run prisma:migrate` to apply migrations to your development database.
4. `npm run dev` → http://localhost:3000

### Local Postgres (Docker)
Alternative to a Neon branch for local development: a PostgreSQL 17 container on host
port 5433 (5432 is left to other projects), with its data in a named volume. The port is
bound to 127.0.0.1 only, so the database is not reachable from the network.

```bash
docker run -d --name junk-removal-postgres -p 127.0.0.1:5433:5432 \
  -e POSTGRES_USER=junk -e POSTGRES_PASSWORD=junk_local_dev \
  -e POSTGRES_DB=junk_removal -v junk-removal-pgdata:/var/lib/postgresql/data \
  postgres:17
```

- In `.env`, set both `DATABASE_URL` and `DATABASE_URL_UNPOOLED` to
  `postgresql://junk:junk_local_dev@127.0.0.1:5433/junk_removal`, then run `npx prisma migrate deploy`.
- If the container exists but is stopped: `docker start junk-removal-postgres`.
- With this local URL, `npm test` also runs the DB integration tests (they create and clean up their own rows).

## Scripts
| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + production build (`DATABASE_URL` is needed once pages read the database at build time) |
| `npm run vercel-build` | Used by Vercel: generate + `prisma migrate deploy` + build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm test` | Vitest; DB integration tests run only when `DATABASE_URL` is set |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:studio` | Browse the database |

## Deployment (Vercel + Neon)
1. Push this repo to GitHub and import it as a Vercel project (framework: Next.js).
   Vercel runs `npm run vercel-build`, which applies pending migrations before building.
2. Add the Neon integration in Vercel (Storage → Neon). It sets `DATABASE_URL` and
   `DATABASE_URL_UNPOOLED` for production and creates a database branch per preview deployment.
3. Add the remaining environment variables from `.env.example` as each roadmap task needs them.
4. Custom domain: Vercel project → Settings → Domains → add the domain and set the DNS
   records Vercel shows. SSL certificates are issued automatically.

## Current phase
**Phase 1 — Core Site & Lead Capture** (see `TODO.md` for task-level status).
Pages and the lead API are still stubs until their roadmap tasks are done;
`POST /api/leads` deliberately returns `501` until task 8 so no lead is ever
reported as received without being stored.
