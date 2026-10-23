# ADR-001: Application stack

- **Status:** Accepted
- **Date:** 2026-10-24   **Jira:** AO-5

## Context
- **Fixed by the proposal (§12, §4):**
  - A staff web app and access-controlled technician link pages.
  - A secure API on PostgreSQL, with Asia/Colombo as the business time zone.
  - A single instance. High availability is out of scope.
- **Work the stack must support:**
  - Scheduled jobs: the 08:00 deadline reminder (§3.5) and the Monday weekly report.
  - Uploads of up to 5 files per job, 10 MB each (§3.6).
  - Email, WhatsApp links with a copy-link fallback, and optional SMS.
  - An append-only audit log (§3.8).
  - Server-side authorization, with passwords of at least 8 characters stored as one-way hashes and no self-service reset (§3.2).
- **How it is built and kept:**
  - A solo, AI-assisted build, then a 6-month warranty handled by one developer.
  - Handover to the Company, including a PostgreSQL dump procedure (§3.9).
  - Playwright-testable UI at WCAG 2.2 AA.
- **Cost rule (decided with Johash, 2026-10-24):** initial development must have no cost. No paid services, licences or API keys are needed for local work, tests or CI.

## Options considered
| Option | Pros | Cons | Cost/risk |
|---|---|---|---|
| **A. TypeScript monolith:** Next.js 16 + Drizzle + PostgreSQL + Better Auth + pg-boss | One language end to end. SQL migrations that are readable at handover. Scheduler and queue live in Postgres, so no Redis. shadcn/ui on Radix gives accessible components. Playwright tests it directly. | Next.js moves quickly. App Router has a learning curve. Better Auth is younger than the alternatives. | Low. One Node process. All components open source. |
| **B. Fastify API + Vite React SPA + Drizzle + PostgreSQL** | Clear API boundary. Little framework magic. | Two deployables, and duplicated types or an RPC layer. More wiring for one developer. | Medium. More to hand over. |
| **C. Django + HTMX** | Mature auth, admin and migrations. | Python and TypeScript split. No end-to-end types. Weaker component library for a rich UI. | Medium. |

## Decision
Option A.

| Layer | Choice | Note |
|---|---|---|
| Framework | Next.js 16.x | 15.x support ends 2026-10-21. Pin the exact patch at scaffold. |
| Runtime | Node.js 24 (Active LTS) | Node 26 becomes LTS on 2026-10-28. Adopt it in a dedicated story. |
| Database | PostgreSQL 18 | Supported to 2030-11. |
| ORM and migrations | Drizzle, SQL migrations in the repo | |
| Auth | Better Auth, username and password sessions | Auth.js is now maintained by the Better Auth team. Verify the password setup in the AO-4 spike. |
| Scheduler | pg-boss cron with `tz: 'Asia/Colombo'` | Verify the version and timezone behaviour in the AO-4 spike. |
| Validation | Zod | |
| Tests | Vitest (unit, and integration against real PostgreSQL), Playwright with axe-core (e2e) | |
| Format and lint | Prettier, ESLint | |
| UI | Tailwind with shadcn/ui | |

**Zero-cost development rule**
- Every chosen component is open source. Confirm each licence in the AO-4 spike.
- Local and CI database: PostgreSQL 18 in Docker locally, and a Postgres service container in CI.
- Email: Mailpit catches mail locally.
- SMS: sits behind an adapter with a fake implementation in dev and test.
- WhatsApp: uses `wa.me` links, which need no API, with the copy-link fallback.
- File storage: local disk in dev and test.
- `scripts/verify.sh` and `scripts/e2e.sh` must pass with no network secrets.
- Real email and SMS providers are wired only for staging and production. Their cost is decided in ADR-002 or later.

**Why:** one language and one deployable suit a solo developer. The team that inherits the system needs only Node and PostgreSQL. Everything the scope needs runs inside the app and Postgres.

## Consequences
- **Easier:** types from the database to the UI, one test toolchain, a simple handover.
- **Harder:** Next.js upgrades need discipline. The version is pinned and upgraded only in a dedicated story.
- **Open dependencies:**
  - ADR-002 must provide a Node runtime, managed PostgreSQL with backups, and persistent file storage.
  - CI runs on GitHub Actions. This is free within the included minutes for a private repo, so check the Company's plan.
  - The §6.3 cost ranges and §9 backup terms were not available in the repo when this was written. ADR-002 must verify them.
- **Harness updates, done by AO-4:**
  - `scripts/verify.sh`
  - `scripts/format-file.sh`
  - `scripts/e2e.sh`
  - CI
  - the tokens and components in `docs/ui/design-system.md`
- **Already updated with this ADR:** `docs/architecture/ARCHITECTURE.md`, the CLAUDE.md Stack section, and `harness.config.json`.

## Sources
- Next.js: https://nextjs.org/
- Node.js release schedule: https://cdn.jsdelivr.net/gh/nodejs/release@main/README.md
- PostgreSQL lifecycle: https://www.herodevs.com/blog-posts/postgresql-eol-dates-every-versions-release-end-of-life-timeline
- Drizzle and Prisma comparison: https://www.bytebase.com/blog/drizzle-vs-prisma.md
- Auth libraries: https://blog.logrocket.com/best-auth-library-nextjs-2026/
- pg-boss scheduling: https://deepwiki.com/timgit/pg-boss/10-scheduling
