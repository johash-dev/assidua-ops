# Assidua Ops

Staff operations platform for Assidua. **Open this product via Amigo Studio** (`C:\Users\Admin\Amigo Studio`) and talk to **Amigo**. Craft skills and specialist agents live there. This repo keeps product facts: code, specs, ADRs, and `AGENTS.md`.

## Stack

Next.js App Router + React + TypeScript, NestJS + TypeScript, PostgreSQL + Prisma, feature-first backend, service-owned business rules, repository-only DB access, server-side authorization, transactional writes, append-only history/audit, decoupled notifications, Playwright for completed flows, GitHub Flow, UI foundation Tailwind + shadcn/ui (ADR-009).

Treat `docs/architecture/`, `docs/specs/`, and `AGENTS.md` as authoritative.

## Runtime

Assidua Ops is a pnpm workspace: `apps/web` (Next.js) and `apps/api` (NestJS) with PostgreSQL via Prisma.

**Prerequisites:** Node 22+ (this repo uses Node 24 locally), pnpm 9+ (`corepack enable` then `corepack prepare pnpm@9.15.9 --activate`; if that is blocked, `npx pnpm@9.15.9` works), Docker.

From Amigo Studio: `npx amigo switch assidua-ops` then `npx amigo run`. Catalog ports are **4000 / 4001 / 5433**.

Or from this directory:

```text
docker compose up -d
copy .env.example .env
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Smoke page: http://localhost:4000/
- Sign in: http://localhost:4000/login
- Taxonomy (Admin): http://localhost:4000/taxonomy
- Users (Admin): http://localhost:4000/staff-users
- Health (via Next rewrite): http://localhost:4000/api/health
- Health (API direct): http://localhost:4001/api/health

Copy `.env.example` to `.env`. Seed creates a bootstrap Admin and one DH per Rivon/Rover/Assidua from `SEED_*` variables (never commit real secrets). `SESSION_SECRET` must be at least 32 characters. Sign in at `/login` — there is no `X-Test-Role` header.

Local Compose publishes Postgres on **5433** so it does not collide with a host Postgres on 5432. CI uses 5432 on the GitHub Actions service. App ports are **4000/4001** (Windows Hyper-V often excludes 3000–3001).

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter api build && pnpm --filter web build
pnpm test:e2e
```

`pnpm test` needs Postgres up. `pnpm test:e2e` needs a prior API/web **build**, or a running `pnpm dev` (Playwright reuses local servers when `CI` is unset).
