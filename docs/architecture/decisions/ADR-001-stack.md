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
| Auth | Better Auth, username and password sessions | Auth.js is now maintained by the Better Auth team. Password setup verified in the AO-6 spike (see Spike findings). |
| Scheduler | pg-boss cron with `tz: 'Asia/Colombo'` | Version and timezone behaviour verified in the AO-6 spike (see Spike findings). |
| Validation | Zod | |
| Tests | Vitest (unit, and integration against real PostgreSQL), Playwright with axe-core (e2e) | |
| Format and lint | Prettier, ESLint | |
| UI | Tailwind with shadcn/ui | |

**Zero-cost development rule**
- Every chosen component is open source. Licences confirmed in the AO-6 spike: [dependency-licences.md](../dependency-licences.md).
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

## Spike findings (AO-6, 2026-10-24)
Run against `postgres:18.3` in Docker, with better-auth 1.7.12, pg-boss 12.38.0, pg 8.23.1 on Node v24.12.0. Scripts were throwaway and are not committed.

**Better Auth (AC1): passes.** Username plugin with `emailAndPassword: { minPasswordLength: 8 }`, using a `pg` Pool as the database and `getMigrations` to create the tables.
```
NEG 7-char password rejected
NEG wrong password rejected
NEG unknown username rejected
STORED 782586646ccd28bc5486… length 161 format salt:hash = true
POS login succeeded (case-insensitive username)
```
- The stored value is a salted one-way hash, not plaintext (§3.2).
- Better Auth needs an email column. Staff have usernames only, so AO-4 must generate a placeholder email (for example `<username>@staff.invalid`) and hide it in the UI.
- **No self-service reset (§3.2):** the reset endpoints (`requestPasswordReset`, `resetPassword`) exist on the API object, but without `sendResetPassword` configured the call fails: `BAD_REQUEST Reset password isn't enabled`. Keep it unconfigured and add a test that asserts it.
- **Scope note:** §3.2 does not mention usernames, but the story AC does. Confirm with Johash that username login is intended.

**pg-boss cron (AC2): passes.** `previewSchedule('0 8 * * *', { tz: 'Asia/Colombo' })` from 2026-10-24T03:00Z:
```
next runs UTC: 2026-10-25T02:30:00.000Z, 2026-10-26T02:30:00.000Z, 2026-10-27T02:30:00.000Z
NEG default UTC would fire at 2026-10-24T08:00:00.000Z
Colombo local: 2026-10-25, 08:00:00 IST   (offset asserted GMT+05:30)
boundaries OK: 18:29:59Z -> 2026-10-24, 18:30:00Z -> 2026-10-25
stored schedule: { name: 'reminder-spike', cron: '0 8 * * *', timezone: 'Asia/Colombo' }
```
- Without `tz`, pg-boss evaluates in UTC and fires at the wrong hour. Always pass `tz`.
- Colombo has no DST, so the offset is a constant +05:30. The date rolls over at 18:30 UTC.
- Not tested: a live firing at 08:00 (would need to wait or fake the clock). Offset and next-run maths are verified, and the schedule row persists with the timezone.
- pg-boss 12 `schedule()` has a `missed` option (`skip` by default). Decide at scaffold whether a missed 08:00 reminder after downtime should be sent (`once`).

**Licences (AC3, AC4):** see [dependency-licences.md](../dependency-licences.md). No paid or incompatible licence, so no decision is raised. MPL-2.0 on a dev-only dependency is noted.

**Flagged, out of scope:** CI uses Node 22 while this ADR says Node 24. AO-4 should align them.
