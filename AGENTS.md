# Assidua Ops

Open this product via **Amigo Studio** (`C:\Users\Admin\Amigo Studio`). Talk to **Amigo**. Do not treat this repo as the Cursor workspace root for day-to-day work.

Craft skills and specialist agents live in Amigo Studio. This repo keeps product facts: code, specs, ADRs, and this file.

## Stack

- pnpm workspace: `apps/web` (Next.js App Router + React + TypeScript), `apps/api` (NestJS + TypeScript)
- PostgreSQL + Prisma
- Feature-first backend: service-owned business rules, repository-only DB access, thin controllers, server-side authorization
- UI foundation: Tailwind + shadcn/ui (ADR-009)
- Tests: Vitest (API) + Playwright E2E
- GitHub Flow

Authoritative docs are in this repo, not in the studio.

## Ports (catalog wins)

Amigo Studio assigns **4000** (web), **4001** (api), **5433** (Postgres). `amigo run` exports `WEB_PORT` / `API_PORT` / `DATABASE_URL`. Do not assume 3000.

- Smoke: http://localhost:4000/
- Health: http://localhost:4001/api/health (or `/api/health` via Next rewrite)

## Spec index

- Requirements: `docs/requirements/`
- Architecture: `docs/architecture/Assidua-Ops-architecture-mvp.md`
- ADRs: `docs/architecture/adr/`
- Specs: `docs/specs/` (AO-F-001 …)
- Plans: `docs/plans/`
- Design: `docs/design/`

Start from `docs/specs/AO-MVP-001-feature-breakdown.md` for MVP scope.

## High risk

Auth, migrations, production, and architecture changes need explicit human approval. AO-F-002 (staff sessions) is implemented locally and awaits review; do not skip the security pass.

## Git

This directory is its own git repo. Commits and PRs happen **here**, never mixed into the Amigo Studio index.
