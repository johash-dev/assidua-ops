# AO-ENG-000 — Platform foundation (PLAN)

**Feature ID:** AO-ENG-000  
**Parent:** AO-MVP-001  
**Authority:** `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED + ADR-009); `docs/specs/AO-MVP-001-feature-breakdown.md`; ADRs 001–009  
**Status:** **COMPLETE** (HUMAN APPROVED close 2026-08-13); REVIEW PASS; IMPLEMENT complete  
**DESIGN (UI/UX):** **skipped** — no staff-facing or customer-facing product UI in this slice (scaffold + health page only)  
**Risk:** Medium (new runtime, CI, env/secrets baseline; no auth, no business schema, no production hosting)

---

## Objective

Stand up a deployable-locally, CI-checked skeleton: **one Next.js app**, **one NestJS API**, **PostgreSQL via Prisma**, **Tailwind + shadcn/ui foundation (ADR-009)**, **env baseline**, **GitHub Flow CI**. Prove the wiring with health checks. Do not implement business features.

---

## Problem / current behavior

Greenfield. Repo is agents, skills, and approved docs only. No `apps/`, no Prisma, no CI, no runtime.

---

## Out of scope (explicit)

- AO-F-001…012 domain modules, schema, seed, auth, notifications, scheduler
- Production/staging hosting, DNS, Dockerfiles for app deploy (client-owned; recurring-costs doc)
- `packages/` shared lib (rule-of-three: zero shared TS packages yet)
- Empty placeholder folders for all 12 feature modules
- Live Mailtrap / Resend / Meta / SMS in CI (adapters land in F-009; CI stays fake later)
- Session cookies, password hashing, login UI (AO-F-002)

---

## Proposed design (locked for this slice)

| Topic | Choice | Why |
|-------|--------|-----|
| Layout | `apps/web` + `apps/api` at repo root | Architecture files/components |
| Package manager | **pnpm** workspaces | One lockfile; no extra monorepo tool |
| Node | **Current Active LTS** at implement time (`engines.node` ≥ 22) | Engineering default |
| API | NestJS, TypeScript strict, global prefix `api` | Browser and direct tests share `/api/...` |
| UI | Next.js App Router | Architecture |
| Same-origin | Next.js rewrite `/api/:path*` → NestJS | BFF-style; cookies in F-002 stay same-site. Prod reverse-proxy should mirror this. |
| DB | PostgreSQL 16 via **Docker Compose** (local port **5433→5432** so host Postgres on 5432 is not shadowed); Prisma in `apps/api/prisma/` | Architecture; managed Postgres later is env swap. CI uses 5432 on the Actions service. |
| Schema | Datasource + generator **only** — **no domain models** | Models belong to F-001… |
| UI foundation | Tailwind + shadcn/ui copy-in `apps/web/components/ui`; tokens in `app/globals.css` | ADR-009 |
| shadcn primitives this slice | Init + **Button** only | Proof of foundation; more components when a UI contract names them |
| Product screens | None. Unauthenticated `/` smoke page: title + health status | Not a staff flow |
| Timezone | Do **not** set host `TZ`. Colombo is application logic (F-008 / F-010) | Architecture: logical TZ ≠ host TZ |
| Secrets | `.env` gitignored; `.env.example` committed, no real credentials | NFR-5 |
| CI | GitHub Actions on PR + push to `main`: lint, typecheck, unit/integration, Playwright smoke | GitHub Flow |
| Scheduler / Redis / queue | Not created | ADR-001 |

**ponytail:** single local Compose Postgres + one API process; upgrade = managed DB + reverse proxy. No multi-instance lock in this slice.

### Runtime shape

```text
Browser → :4000 Next.js
            ├─ /                 smoke page (ADR-009 tokens + Button)
            └─ /api/*  rewrite → :4001 NestJS
                                   GET /api/health  { status, db }
                                   Prisma → Postgres :5432
```

### Env baseline (`.env.example`)

```text
NODE_ENV=development
DATABASE_URL=postgresql://assidua:assidua@localhost:5433/assidua_ops
API_PORT=4001
WEB_PORT=4000
API_ORIGIN=http://localhost:4001
```

F-002 will add session secret + bootstrap Admin/DH credentials. Do not invent those names here.

---

## Acceptance criteria

- Given Compose Postgres is up and env is set, when API starts, then `GET /api/health` returns 200 `{ "status": "ok", "db": "up" }`.
- Given API is down or DB is unreachable, when health is called, then the response is not a false `db: "up"` (process may still boot; health must report db down or fail the check).
- Given `pnpm dev` (or documented equivalent), when a browser opens `/`, then the smoke page renders using the ADR-009 foundation and shows API health.
- Given CI on a PR, when checks run, then lint, typecheck, API health test (with Postgres service), and Playwright `/` smoke pass **without** live messaging providers.
- Given the repo, when inspected, then `.env` is gitignored and `.env.example` has no secrets.
- Given Prisma, when `migrate` runs against empty domain schema, then migrate succeeds (baseline migration exists).

---

## Implementation steps

### 1. Workspace + ignore + engines

Goal: pnpm workspace that can host `apps/web` and `apps/api`.  
Files: `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.nvmrc` or `engines` in root `package.json`, `.env.example`  
Existing pattern: none (greenfield)  
Change: root scripts `dev`, `lint`, `typecheck`, `test`, `test:e2e` that delegate to workspaces. Ignore `node_modules`, `.env`, `dist`, `.next`, `coverage`.  
Dependencies: none  
Validation: `pnpm -v` / `pnpm install` succeeds  
Risk: Low

### 2. Local Postgres

Goal: one-command local database.  
Files: `docker-compose.yml` (service `postgres` only; user/password/db matching `.env.example`)  
Existing pattern: none  
Change: Postgres 16, port 5432, named volume. No app containers.  
Dependencies: step 1  
Validation: `docker compose up -d` then `psql` or Prisma can connect  
Risk: Low

### 3. NestJS API + process health

Goal: API boots and serves `GET /api/health` without DB.  
Files: `apps/api/**` (NestJS CLI or equivalent minimal AppModule); `HealthController` / `HealthService` stub returning `{ status: "ok", db: "unknown" }` until step 4  
Existing pattern: architecture Controller → Service (no repository yet)  
Change: strict TS; global prefix `api`; listen `API_PORT`. **Do not** add identity/taxonomy/… modules.  
Dependencies: step 1  
Validation: `pnpm --filter api start` (or `dev`); curl `/api/health` → 200  
Risk: Low

### 4. Prisma + DB health

Goal: Prisma wired; migrate works; health pings DB.  
Files: `apps/api/prisma/schema.prisma` (datasource + generator only); initial migration; `HealthService` uses Prisma `$queryRaw` `SELECT 1`; PrismaModule  
Existing pattern: repository-only DB access — health may call Prisma directly (no domain repo). Do not introduce a generic repository framework.  
Change: `prisma migrate` in API package scripts. No `seed.ts` (F-001 / F-002).  
Dependencies: steps 2–3  
Validation: migrate apply; health `{ db: "up" }`; stop Postgres → health does not report `db: "up"`  
Risk: Low

### 5. Next.js + ADR-009 + rewrite + smoke page

Goal: staff-app shell foundation without product screens.  
Files: `apps/web/**`; `app/globals.css` tokens (color, type, spacing, radius, focus); `components/ui/button` (shadcn); `app/page.tsx` smoke; `next.config` rewrite `/api/:path*` → `API_ORIGIN/api/:path*`  
Existing pattern: ADR-009  
Change: Tailwind + shadcn init. No `(staff)` routes, no `/t/[token]`, no nav. Smoke page: heading “Assidua Ops”, shadcn Button, health fetch via `/api/health`.  
Dependencies: step 3 (rewrite target)  
Validation: `pnpm --filter web dev`; `/` renders; `/api/health` via Next origin returns API JSON  
Risk: Low

### 6. Tests

Goal: one API check + one Playwright smoke that fail if wiring breaks.  
Files: `apps/api` health test (supertest or Nest testing); `apps/web` or repo-root Playwright spec `smoke.spec.ts`  
Existing pattern: feature-owned tests later; this slice owns foundation checks only  
Change: Playwright config `baseURL` = web origin. No product-flow specs.  
Dependencies: steps 4–5  
Validation: `pnpm test` and `pnpm test:e2e` green locally with Compose up  
Risk: Low

### 7. GitHub Actions

Goal: PR cannot merge on red lint/type/test/e2e.  
Files: `.github/workflows/ci.yml`  
Existing pattern: GitHub Flow  
Change: `pnpm install --frozen-lockfile`; Postgres service container; `DATABASE_URL` to service; migrate; lint; typecheck; unit/integration; Playwright (install browsers in CI). No live provider secrets.  
Dependencies: step 6  
Validation: workflow file present; after first push, CI green (human verifies on GitHub)  
Risk: Medium (CI env drift)

### 8. Root README runtime section

Goal: a human can boot the skeleton from the repo.  
Files: `README.md` (add **Runtime** section; keep agents/skills section)  
Existing pattern: current README is the operating layer  
Change: prerequisites (Node LTS, pnpm, Docker), `docker compose up -d`, copy `.env.example` → `.env`, `pnpm install`, `pnpm dev`, health URLs.  
Dependencies: steps 1–7  
Validation: instructions match actual scripts  
Risk: Low

---

## Files / components (target)

```text
package.json
pnpm-workspace.yaml
pnpm-lock.yaml
.gitignore
.env.example
docker-compose.yml
.github/workflows/ci.yml
apps/api/
  src/main.ts
  src/app.module.ts
  src/health/health.controller.ts
  src/health/health.service.ts
  src/prisma/prisma.module.ts
  src/prisma/prisma.service.ts
  prisma/schema.prisma
  prisma/migrations/...
  test/health.e2e-spec.ts   (or equivalent)
apps/web/
  app/globals.css
  app/layout.tsx
  app/page.tsx
  components/ui/button.tsx
  next.config.ts
playwright.config.ts
e2e/smoke.spec.ts
```

Do not create `packages/`, feature module stubs, or `prisma/seed.ts`.

---

## Data / API / authorization

- **Data:** no business tables. Prisma client exists.  
- **API:** `GET /api/health` only.  
- **Authorization:** none. Health is unauthenticated. Staff auth is F-002.

---

## Testing

| Check | Asserts |
|-------|---------|
| API health (DB up) | 200, `status=ok`, `db=up` |
| API health (DB down) | not `db=up` |
| Playwright `/` | heading visible; health ok shown |
| CI | lint + typecheck + above |

No Playwright product flows (those attach to F-001… when UI contracts exist).

---

## Migration impact

One baseline Prisma migration with **zero models**. Later features add models + migrations (F-001 first). Not a single mega-schema in this slice (architecture “initial only” referred to greenfield product schema; delivery order overrides packing F-001…012 into ENG-000).

---

## Risks

| Risk | Mitigation |
|------|------------|
| Next rewrite drops headers later (Set-Cookie in F-002) | Document same-origin contract; F-002 PLAN verifies cookie through rewrite or switches to explicit proxy |
| shadcn/Tailwind version churn | Pin versions in lockfile; do not invent a second kit |
| CI without Docker socket for Playwright | Use Playwright’s CI install; Postgres as GHA service, not Compose-in-CI |
| Scope creep into F-001/F-002 | Reject domain models, seed users, login |

---

## Alternatives rejected

| Alternative | Why not |
|-------------|---------|
| npm/yarn | pnpm is enough; don’t add Turborepo until scripts hurt |
| Full domain Prisma schema now | Implements F-001…012 early; violates slice order |
| App Dockerfiles + compose for web/api | Hosting not in this slice; `pnpm dev` is the skeleton |
| CORS split origins | Worse for F-002 cookies; architecture asked BFF-style |
| Whole shadcn catalog | Unused components; add when UI contracts need them |
| DESIGN for smoke page | Not a staff/customer product flow |

---

## Validation commands (after IMPLEMENT)

```text
docker compose up -d
cp .env.example .env
pnpm install
pnpm --filter api prisma migrate deploy
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm dev
# GET http://localhost:4000/          smoke page
# GET http://localhost:4000/api/health
# GET http://localhost:4001/api/health
```

Exact script names may match workspace conventions; README must list the real ones.

---

## Human approval

**Stop point.** No production code until this PLAN is approved.

- [x] Approve AO-ENG-000 PLAN as written — **HUMAN APPROVED 2026-08-13**
- [ ] Approve with amendments: _______________________
- [ ] Reject / replan

Suggested confirmations (engineering, not new business rules):

1. pnpm + Next rewrite same-origin + Compose Postgres only  
2. No domain schema / no hosting in this slice  
3. DESIGN skip for smoke page  
4. ADR-009 scaffolding (tokens + Button) lands here, before F-001 UI
