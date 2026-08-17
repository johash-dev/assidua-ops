# AO-F-001 — Department & category taxonomy (PLAN)

**Feature ID:** AO-F-001  
**Parent:** AO-MVP-001  
**Authority:** `docs/specs/AO-F-001-taxonomy.md` (spec HUMAN APPROVED 2026-08-12; UI contract HUMAN APPROVED 2026-08-13); `docs/architecture/Assidua-Ops-architecture-mvp.md`; ADR-001, ADR-009  
**Status:** IMPLEMENT complete; independent review passed (2026-08-18); lint/typecheck/test/e2e green (2026-08-13) plus pruneInactive regression (2026-08-18)  
**DESIGN (UI/UX):** complete — `/taxonomy` Admin tree + dialogs  
**Risk:** High (first domain schema/migration; first staff UI; temporary auth harness that must not work in production)

---

## Objective

Persist the confirmed department/category tree, enforce Admin-only mutations and deactivate/department-move guards, seed Rivon/Rover/Assidua, and ship the approved Admin `/taxonomy` screen. Do not implement login, jobs, or SLA bulk prompts.

---

## Problem / current behavior

ENG-000 skeleton only: `GET /api/health`, Prisma with **zero models**, smoke page at `/`. No `taxonomy` module, no seed, no staff routes.

---

## Out of scope (explicit)

- Staff login/session, roles as real users, staff shell/nav (AO-F-002) — this slice uses a **dev/test-only** principal header
- Job model / intake / reclassify (AO-F-005)
- SLA bulk “update open jobs?” prompt (AO-F-008) — `defaultSlaDays` is stored only
- Audit writes (I45)
- Hard-delete, Leaf↔Group conversion, add-child-under-leaf
- Playwright: non-Admin access-denied; deactivate-blocked-by-job (needs F-002 session + F-005 Job). Covered in API/unit this slice.

---

## Proposed design (locked for this slice)

| Topic | Choice | Why |
|-------|--------|-----|
| Module | `apps/api/src/taxonomy/` Controller → Service → Repository → Prisma | Architecture; first feature sets the pattern |
| Schema | `Department` + `CategoryNode` only | Spec data behavior; no Job |
| IDs | `cuid()` strings | Prisma default; no spec UUID requirement |
| Seed | `prisma/seed.ts` taxonomy tree only; idempotent by name path | Architecture seed is 3 depts + leaves; DHs are F-002 |
| Authz | Nest guard: production **401** without a principal; `development`/`test` accept `X-Test-Role` | Spec allows harness until F-002; must not be a prod bypass |
| GET `/api/taxonomy` | Admin: full tree incl. inactive. Other test roles: active leaves + ancestor groups only | Spec read matrix |
| Mutations | Admin only; 403 otherwise | NFR-4 |
| Job-reference guard | `TaxonomyRepository.referencesExist(...)` returns **false**; service still calls it | **ponytail:** F-005 replaces the body with a jobs-service call. Unit tests stub `true`. |
| Leaf helper | `requireActiveLeaf(id)` throws if missing/inactive/non-leaf | Satisfies “non-leaf as job category rejected” without a job API; F-005 will call it |
| `defaultSlaDays` | Integer ≥ 1 in service; seed 10. PATCH does **not** recalc jobs | FR-T6; F-008 owns bulk path later |
| Error body | `{ code, message }` 4xx; codes listed below | Spec: stable, test-assertable |
| UI | `apps/web/app/taxonomy/page.tsx` — one tree, dialogs, stay on page | Approved UI contract |
| shadcn this slice | `input`, `dialog`, `alert-dialog`, `alert` (+ existing `Button`) | Named by UI contract; native `<select>` for type/parent (no extra Select kit) |
| Shared PageHeader / EmptyState | **Not extracted** | Rule-of-three; local heading + empty copy |
| Playwright | Admin harness: see seed tree; create leaf; deactivate unreferenced leaf | Spec E2E sequencing; rest waits F-002/F-005 |

**ponytail:** `X-Test-Role` is a global lock on “no identity yet”; upgrade = delete the header branch in F-002 and read the session principal.

### Runtime shape

```text
Browser → :4000 /taxonomy
            └─ /api/* rewrite → :4001
                 GET  /api/taxonomy
                 POST /api/departments
                 PATCH /api/departments/:id
                 POST /api/categories
                 PATCH /api/categories/:id
```

### Test principal

Header: `X-Test-Role: ADMIN | DEPARTMENT_HEAD | FRONT_DESK | COORDINATOR`

- Applied only when `NODE_ENV` is `development` or `test`.
- Any other env (including `production`): ignore the header; unauthenticated → **401**.
- Web page in this slice: Playwright (and local demo) send the header via extra HTTP headers. The page does not implement login. No staff nav.

### Error codes

| Code | When |
|------|------|
| `UNAUTHORIZED` | No principal |
| `FORBIDDEN` | Authenticated non-Admin mutate |
| `SLA_DAYS_INVALID` | missing / non-integer / `< 1` |
| `TAXONOMY_INVALID_PARENT` | missing dept, parent not in dept, parent is a leaf, parent cycle |
| `TAXONOMY_DEACTIVATE_REFERENCED` | deactivate leaf/dept while `referencesExist` |
| `TAXONOMY_DEPARTMENT_CHANGE_REFERENCED` | leaf `departmentId` change while `referencesExist` |
| `TAXONOMY_NOT_LEAF` | `requireActiveLeaf` on non-leaf / inactive / missing |
| `VALIDATION` | blank name after trim; unknown id |

### Tree DTO (GET)

```text
{
  departments: [{
    id, name, active, defaultSlaDays,
    categories: [{ id, name, parentId, isLeaf, active, children: [...] }]
  }]
}
```

Categories nested from `parentId === null` under each department. Non-Admin payload omits inactive nodes and omits groups that have no remaining active-leaf descendants.

### Mutation rules (service)

- Trim names; reject empty.
- Create category: `isLeaf` required boolean; `parentId` optional; parent must be same `departmentId` and **not** a leaf.
- PATCH category: **ignore/reject `isLeaf` change**. Name always ok. `parentId` only within same department, not a leaf, not self/descendant. `departmentId` change **only if `isLeaf`**; then parent must be null or a group in the **new** department; reject if `referencesExist`.
- PATCH department: name; `defaultSlaDays` ≥ 1; `active` true/false. Deactivate rejected if `referencesExist` for that department (any job on dept or its categories — when Job exists).
- Reactivate: `active: true`, no reference check.
- Group (non-leaf) deactivate: allowed in this slice (jobs do not point at groups). Do not cascade-deactivate children.

---

## Acceptance criteria (this slice)

From the spec, observable now:

- After seed, GET as Admin returns Rivon/Car, Rover/Bike, Assidua leaves (A/C, UPS, Smart Board, Tv, Washing Machine, Fridge under Home Appliances), all active, departments matching the tree.
- `requireActiveLeaf(Home Appliances)` (or equivalent) is rejected (`TAXONOMY_NOT_LEAF`).
- Admin creates department with name + `defaultSlaDays` ≥ 1 → persisted active.
- Admin creates/edits a leaf under a department or group → appears as leaf; `departmentId` is that department.
- `defaultSlaDays` < 1 → `SLA_DAYS_INVALID`.
- DH/FD/Coordinator mutate → 403.
- Unauthenticated mutate/GET → 401 (production and when no test header).
- Deactivate with stubbed `referencesExist=true` → rejected; with `false` → succeeds; inactive leaf omitted from non-Admin GET.
- `/taxonomy` (Admin harness): seed tree visible; create leaf; deactivate unreferenced leaf; stay on page.

Deferred AC (still spec DoD, not this PLAN’s Playwright): non-Admin cannot open manage taxonomy (F-002); deactivate rejected when a real Job row exists (F-005).

---

## Implementation steps

### 1. Prisma models + migration

Goal: `Department` and `CategoryNode` exist; migrate applies.  
Files: `apps/api/prisma/schema.prisma`; new migration under `apps/api/prisma/migrations/`  
Existing pattern: ENG-000 datasource/generator only  
Change: two models as in Data below. No `Job`. No unique-on-name (spec does not require it).  
Dependencies: none  
Validation: `pnpm db:migrate` succeeds on empty-of-domain DB  
Risk: Medium (first business migration)

### 2. Idempotent seed

Goal: confirmed tree present after `db seed`, re-runnable.  
Files: `apps/api/prisma/seed.ts`; `schema.prisma` `previewFeatures` not needed; package `prisma.seed` = `tsx prisma/seed.ts`; root `db:seed` script  
Existing pattern: none  
Change: find-or-create Rivon/Rover/Assidua (`defaultSlaDays` 10) and the FR-T2 nodes. Do not create staff users.  
Dependencies: step 1  
Validation: seed twice; still one Car under Rivon, one Home Appliances under Assidua, three appliance leaves  
Risk: Low

### 3. Test principal guard

Goal: mutations cannot be anonymous; prod cannot use the header.  
Files: `apps/api/src/taxonomy/test-principal.ts` (or `taxonomy.guard.ts`) — **keep inside taxonomy**, F-002 deletes/replaces  
Existing pattern: none (health is public)  
Change: guard reads `X-Test-Role` iff `NODE_ENV` is `development` or `test`. Attach `{ role }` on request. Missing → 401.  
Dependencies: none  
Validation: unit: prod-like `NODE_ENV` ignores header; test env accepts ADMIN  
Risk: High (auth bypass if env check is wrong)

### 4. Taxonomy repository + service + HTTP

Goal: spec API + rules.  
Files: `apps/api/src/taxonomy/taxonomy.{module,controller,service,repository}.ts`; register in `app.module.ts`  
Existing pattern: `HealthController` / `HealthService` / `PrismaService`; repository is new (health talks to Prisma directly — do not copy that for domain)  
Change: thin controller; all rules in service; Prisma only in repository. Codes as table above. `referencesExist` → `false`.  
Dependencies: steps 1, 3  
Validation: HTTP tests below  
Risk: Medium

### 5. API tests

Goal: AC that does not need a browser.  
Files: `apps/api/src/taxonomy/taxonomy.service.spec.ts`; `apps/api/test/taxonomy.e2e.spec.ts` (supertest, same pattern as `health.e2e.spec.ts`)  
Existing pattern: vitest + Nest testing + supertest  
Change: seed or insert tree in e2e `beforeAll`. Cases: seed shape; Admin CRUD; SLA reject; 403 for FD/DH/Coordinator; 401 without header; parent=leaf reject; `requireActiveLeaf` on group; deactivate/move when repository stubbed referenced vs not.  
Dependencies: steps 2–4  
Validation: `pnpm test` green  
Risk: Low

### 6. Admin `/taxonomy` UI

Goal: approved UI contract, no login shell.  
Files: `apps/web/app/taxonomy/page.tsx` (client); shadcn `input`, `dialog`, `alert-dialog`, `alert` under `components/ui/`  
Existing pattern: ADR-009 tokens + `Button`; smoke page stays at `/`  
Change: nested list tree; dialogs for create/edit; confirm deactivate; inline validation; show API `message`/`code` on failure; fetch `/api/taxonomy` via rewrite. Playwright will inject `X-Test-Role`. Do not add nav on the smoke page.  
Dependencies: step 4  
Validation: `pnpm --filter web typecheck`; manual `/taxonomy` with header  
Risk: Medium (first staff screen)

### 7. Playwright Admin slice

Goal: one spec that fails if seed or Admin tree wiring breaks.  
Files: `e2e/taxonomy.spec.ts`  
Existing pattern: `e2e/smoke.spec.ts`  
Change: `page.setExtraHTTPHeaders({ "X-Test-Role": "ADMIN" })`; assert seed names; add a leaf under Rover; deactivate that leaf; still on `/taxonomy`. Do **not** assert non-Admin deny or job-referenced deactivate.  
Dependencies: steps 2, 6  
Validation: `pnpm test:e2e` (dev servers or CI webServer)  
Risk: Low

### 8. README

Goal: human can seed and open the tree locally.  
Files: `README.md` Runtime section  
Existing pattern: ENG-000 boot instructions  
Change: `pnpm db:seed`; URL `/taxonomy`; document `X-Test-Role` as **temporary, non-production**; F-002 removes it.  
Dependencies: steps 2, 6  
Validation: instructions match scripts  
Risk: Low

---

## Files / components (target)

```text
apps/api/prisma/schema.prisma
apps/api/prisma/migrations/<timestamp>_taxonomy/
apps/api/prisma/seed.ts
apps/api/src/taxonomy/taxonomy.module.ts
apps/api/src/taxonomy/taxonomy.controller.ts
apps/api/src/taxonomy/taxonomy.service.ts
apps/api/src/taxonomy/taxonomy.repository.ts
apps/api/src/taxonomy/taxonomy.guard.ts
apps/api/src/taxonomy/taxonomy.service.spec.ts
apps/api/test/taxonomy.e2e.spec.ts
apps/web/app/taxonomy/page.tsx
apps/web/components/ui/input.tsx
apps/web/components/ui/dialog.tsx
apps/web/components/ui/alert-dialog.tsx
apps/web/components/ui/alert.tsx
e2e/taxonomy.spec.ts
README.md
package.json   # db:seed only if missing
```

Do not create `packages/`, `identity/`, `jobs/`, staff layout/nav, or audit rows.

---

## Data / API / authorization

**Data**

- `Department`: id, name, active, defaultSlaDays (Int, default 10), timestamps  
- `CategoryNode`: id, name, departmentId, parentId?, isLeaf, active, timestamps  

**API** (global prefix `api` already set)

| Method | Path | Authz |
|--------|------|-------|
| GET | `/taxonomy` | Any test/staff principal |
| POST | `/departments` | Admin |
| PATCH | `/departments/:id` | Admin |
| POST | `/categories` | Admin |
| PATCH | `/categories/:id` | Admin |

**Authorization:** server guard only. UI hide is not security. Production has no principal until F-002 → 401.

---

## Testing

| Check | Asserts |
|-------|---------|
| Seed (service or e2e) | FR-T2 tree, SLA 10, leaves vs Home Appliances group |
| Service | SLA < 1; invalid parent; requireActiveLeaf; deactivate/move with stubbed references |
| HTTP authz | Admin 200 mutate; FD/DH/Coordinator 403; no header 401 |
| HTTP GET | Admin sees inactive; non-Admin does not |
| Playwright | Admin tree + create leaf + deactivate unreferenced |
| CI | existing lint/typecheck/test/e2e plus above |

---

## Migration impact

One additive migration. Empty-domain DBs (ENG-000 baseline) migrate forward. No backfill. Seed is separate from migrate (`db:seed` after `db:migrate`). CI: run seed before taxonomy e2e if tests expect the named tree (or insert in `beforeAll` — prefer **seed script** so local and CI match).

---

## Risks

| Risk | Mitigation |
|------|------------|
| `X-Test-Role` works in production | Guard keys off `NODE_ENV`; test the negative; README + F-002 deletion |
| Job guard always false until F-005 | Stub in unit tests; comment on repository method; F-005 must flip it |
| Editing `defaultSlaDays` bypasses F-008 bulk prompt later | Comment on department PATCH; F-008 PLAN wires one service entry (FR-S10) |
| First staff URL with no shell | Acceptable; F-002 adds nav. Do not invent a layout here |
| Duplicate seed rows | Idempotent find-or-create by department name + parent+name |

---

## Alternatives rejected

| Alternative | Why not |
|-------------|---------|
| Ship API only, defer `/taxonomy` to F-002 | UI contract approved; Admin Playwright can run with harness |
| Treat all local requests as Admin with no header | Accidental open API; header makes role matrix testable now |
| Add `Job` table for deactivate e2e | Implements F-005 early |
| class-validator / CQRS / generic repo base | One feature; validate in service |
| shadcn Select + shared PageHeader | Native select; rule-of-three |
| Unique department name in DB | Not in spec |

---

## Validation commands (after IMPLEMENT)

```text
docker compose up -d
copy .env.example .env
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm dev
# GET http://localhost:4001/api/taxonomy   needs X-Test-Role
# http://localhost:4000/taxonomy           Playwright sets the header; for a browser, use a header extension or wait for F-002
```

---

## Human approval

**Stop point.** No production code until this PLAN is approved.

- [x] Approve AO-F-001 PLAN as written — **HUMAN APPROVED 2026-08-13**
- [ ] Approve with amendments: _______________________
- [ ] Reject / replan

Suggested confirmations (engineering, not new business rules):

1. Dev/test `X-Test-Role` harness; production 401 until F-002  
2. No `Job` model; `referencesExist` is false until F-005 (unit-stubbed)  
3. `/taxonomy` UI this slice; non-Admin and job-block Playwright wait  
4. Seed taxonomy only (no DH users)  
5. `defaultSlaDays` stored here; no F-008 bulk prompt  
