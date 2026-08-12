# AI-Native Engineering Agents & Skills

A project-specific AI engineering operating layer for the Assidua Service Platform.

Inspired by the composable, small-skill philosophy of Matt Pocock's `skills` and the comprehension-first, minimal-change philosophy of Dietrich Gebert's `ponytail`.

## Architecture

```text
Human
  ↓
Orchestrator
  ↓
Workflow
  ↓
Specialist Agent
  ↓
Relevant Skills
  ↓
Tools / Repository
  ↓
Artifact + Evidence
  ↓
Independent Validation
  ↓
Human Approval
```

Agents own responsibilities. Workflows control ordering. Skills provide reusable capability. Artifacts preserve state.

## Agents

- `agents/00-orchestrator.md`
- `agents/01-requirements-agent.md`
- `agents/02-architect-agent.md`
- `agents/03-builder-agent.md`
- `agents/04-reviewer-agent.md`
- `agents/05-debugger-agent.md`
- `agents/06-release-agent.md`
- `agents/07-research-agent.md`
- `agents/08-test-agent.md`
- `agents/09-uiux-agent.md`

## Skills

- grill-requirements
- codebase-comprehension
- architecture-design
- feature-specification
- ui-interaction-design
- implementation-planning
- vertical-slice-implementation
- minimal-change-engineering
- testing-validation
- code-review
- security-review
- debugging
- architecture-audit
- refactoring
- git-pr
- handoff-context
- skill-governance

## Project context

The supplied architecture establishes Next.js App Router + React + TypeScript, NestJS + TypeScript, PostgreSQL + Prisma, feature-first backend organization, service-owned business rules, repository-only DB access, server-side authorization, transactional writes, append-only history/audit, decoupled notifications, Playwright for completed flows, GitHub Flow for the MVP, and a code-first UI foundation (Tailwind CSS + shadcn/ui — ADR-009).

Always treat the supplied project architecture files as authoritative.

## Runtime

Assidua Ops is a pnpm workspace: `apps/web` (Next.js) and `apps/api` (NestJS) with PostgreSQL via Prisma.

**Prerequisites:** Node 22+ (this repo uses Node 24 locally), pnpm 9+ (`corepack enable` then `corepack prepare pnpm@9.15.9 --activate`; if that is blocked, `npx pnpm@9.15.9` works), Docker.

```text
docker compose up -d
copy .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

- Smoke page: http://localhost:4000/
- Health (via Next rewrite): http://localhost:4000/api/health
- Health (API direct): http://localhost:4001/api/health

Local Compose publishes Postgres on **5433** so it does not collide with a host Postgres on 5432. CI uses 5432 on the GitHub Actions service. App ports are **4000/4001** (Windows Hyper-V often excludes 3000–3001).

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter api build && pnpm --filter web build
pnpm test:e2e
```

`pnpm test` needs Postgres up. `pnpm test:e2e` needs a prior API/web **build**, or a running `pnpm dev` (Playwright reuses local servers when `CI` is unset).
