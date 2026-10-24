# Architecture

> Stack: [ADR-001](decisions/ADR-001-stack.md), accepted. Hosting: [ADR-002](decisions/ADR-002-hosting.md), accepted.

## Stack (ADR-001)
| Layer | Choice |
|---|---|
| Framework / runtime | Next.js 16.x on Node.js 24 (single process) |
| Database | PostgreSQL 18, Drizzle ORM, SQL migrations in the repo |
| Auth | Better Auth, username and password sessions |
| Scheduler | pg-boss cron, `tz: 'Asia/Colombo'` |
| Validation / UI | Zod; Tailwind + shadcn/ui |
| Tests | Vitest (unit, integration on real PostgreSQL); Playwright + axe-core (e2e) |

Development is zero-cost: local Docker PostgreSQL, Mailpit for email, a fake SMS adapter, local-disk files, and `wa.me` links for WhatsApp.

## Hosting (ADR-002)
| Concern | Choice |
|---|---|
| App | Render web service, Singapore, Docker image, one instance per environment (pg-boss in the same process) |
| Database | Render Postgres 18, same region. PITR plus a nightly `pg_dump` kept 14 days |
| Files | Render persistent disk behind the storage adapter |
| Email / SMS | EmailJS / Notify.lk, each behind an adapter with a fake for dev, test and CI |
| Environments | QA when the first `/qa` is due, staging at the first rc tag, production at release |

## Fixed constraints (proposal §12)
- Staff web application, plus access-controlled technician link pages.
- Secure API. PostgreSQL. Business time zone Asia/Colombo.
- Single instance. High-availability is out of scope (§4).
- Integrations: email (notifications and reports), WhatsApp (job links, with a copy-link fallback), optional SMS.
- Scheduled jobs: 08:00 deadline reminder, Monday weekly report.
- File storage on the Company's hosting (attachment caps per BR-9).

## Module map (to fill)
| Module | Responsibility | Scope |
|---|---|---|
| auth & staff | sessions, roles, invariants BR-13..15 | §3.2 |
| customers | customers & sites | §3.1 |
| inquiries/jobs | inquiry creation, reference numbers, job lifecycle, notes | §3.3 |
| technicians | directory, share links | §3.4 |
| notifications | in-app, email, SMS, schedulers | §3.5 |
| attachments | upload/validate/store | §3.6 |
| reporting | KPIs, CSV, weekly email | §3.7 |
| audit | append-only activity history | §3.8 |
