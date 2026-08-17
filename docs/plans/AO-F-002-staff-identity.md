# AO-F-002 — Staff identity (PLAN)

**Feature ID:** AO-F-002  
**Parent:** AO-MVP-001  
**Authority:** `docs/specs/AO-F-002-staff-identity.md` (spec HUMAN APPROVED 2026-08-12; UI contract HUMAN APPROVED 2026-08-18); `docs/architecture/Assidua-Ops-architecture-mvp.md`; ADR-002 option A; ADR-007  
**Status:** PLAN HUMAN APPROVED (2026-08-18); IMPLEMENT complete; lint/typecheck/test/e2e green; awaiting independent review + security pass  
**DESIGN (UI/UX):** complete — `/login`, `/home`, `/staff-users`, `/forbidden`, staff shell; `/` stays public  
**Risk:** High (auth, sessions, password hashes, secrets, first migration that stores credentials, replaces F-001 `X-Test-Role`)

---

## Objective

Ship first-party email + password staff sessions, Admin user/role management (including sole-DH replacement and last-Admin guard), go-live seed (Admin + three DHs from env), append-only audit **writes** for user/role changes, and the staff shell. Delete the F-001 `X-Test-Role` harness. Do not implement technician login, SSO, or the audit viewer.

---

## Problem / current behavior

F-001 is on `main`: taxonomy API + Admin `/taxonomy` UI. Principal is `{ role }` from `X-Test-Role` when `NODE_ENV` is `development` or `test`. Production has no staff users. No `identity` or `audit` module. Seed is taxonomy-only. Playwright and the taxonomy page send the test header.

---

## Out of scope (explicit)

- Technician shareable-link auth (AO-F-006 / ADR-007)
- SSO, magic link, MFA, self-service reset, password-complexity beyond ≥ 8
- Job/customer/report authorization matrices (expose principal only)
- Audit **viewer** (AO-F-012) — writes only
- Taxonomy/notification-setting audit (I45)
- “Log out everywhere”, session list, remember-me, idle timeout
- Title/org-label fields
- Shared `packages/`, cookie-parser, bcrypt/argon2, JWT libraries
- Changing ENG-000 `/` smoke into a staff home

---

## Proposed design (locked for this slice)

| Topic | Choice | Why |
|-------|--------|-----|
| Module | `apps/api/src/identity/` Controller → Service → Repository | Architecture feature map |
| Audit writes | Tiny `apps/api/src/audit/` service + repository; identity calls it inside the same Prisma transaction | Spec FR-I13; F-012 will read the same table; no viewer UI |
| Schema | `StaffUser`, `StaffSession`, `AuditEntry` | Spec data + logout that actually ends the session |
| IDs | `cuid()` strings | Same as F-001 |
| Email | Trim + lowercase; unique | Avoid duplicate-account case bugs |
| Passwords | `node:crypto.scrypt` (stdlib); store `scrypt$N$r$p$salt$hash`; never return `passwordHash` | NFR-5; no new native dep |
| Session | Opaque token in HTTP-only cookie; DB stores `HMAC-SHA256(SESSION_SECRET, token)`; logout deletes the row | Spec “server-recognized”; NFR-5 secret in env; share-link hash-at-rest pattern |
| Cookie | Name `assidua_session`; `Path=/`; `HttpOnly`; `SameSite=Lax`; `Secure` only when `NODE_ENV=production` | Browser talks to web `:4000`; Next rewrite proxies `Set-Cookie` |
| Lifetime | **Absolute 12 hours** from login; no idle timeout | Spec left this to PLAN; idle needs lastSeen on every request |
| CSRF | `SameSite=Lax` + mutating requests with `Origin` must match `WEB_ORIGIN` (missing `Origin` allowed for non-browser tests) | Spec asked PLAN to pick; no extra CSRF cookie |
| Login failures | One code `INVALID_CREDENTIALS` for unknown email, bad password, and inactive | Avoid user enumeration |
| DH replace | Dedicated `POST /api/staff-users/dh-replace` | Spec optional dedicated; PATCH on one id cannot swap two users cleanly |
| Principal | `{ id, email, name, role, departmentId, active }` on the request | FR-I14; taxonomy reads `role` only |
| Authz | `AuthGuard` + `AdminGuard` owned by **identity**; taxonomy switches to them | One guard; delete `X-Test-Role` |
| Taxonomy UI | Admin-only page (F-001 contract); unauthenticated → `/login`; non-Admin → `/forbidden` | Closes F-001 deferred access-denied |
| Seed | After taxonomy: bootstrap Admin + DH per Rivon/Rover/Assidua from env; idempotent by email; **do not rotate** an existing user’s password | FR-I1b / M35 / I44 |
| UI | Client pages + staff layout; `fetch(..., { credentials: "include" })` | Matches taxonomy client style; UI is not the authz boundary |
| shadcn this slice | Existing `button`, `input`, `dialog`, `alert-dialog`, `alert` | Named by UI contract; native `<select>` + `<table>` |
| Playwright | Real login; no `X-Test-Role` | Header must die |

**ponytail:** no idle timeout (ceiling = a stolen cookie works until absolute expiry or logout). Upgrade = `lastSeenAt` + idle window.

**ponytail:** `AuditEntry.metadata` is a JSON blob until F-012 locks a DTO. Upgrade = typed columns / viewer mapping.

### Runtime shape

```text
Browser → :4000 /login | /home | /staff-users | /taxonomy | /forbidden
            └─ /api/* rewrite → :4001
                 POST /api/auth/login          public
                 POST /api/auth/logout         cookie
                 GET  /api/auth/me             cookie
                 GET  /api/staff-users         Admin
                 POST /api/staff-users         Admin
                 PATCH /api/staff-users/:id    Admin
                 POST /api/staff-users/dh-replace  Admin
                 GET  /api/taxonomy            any staff session
                 POST/PATCH taxonomy           Admin session
```

Health stays public. Cookie is set for the **web origin** (`:4000`) via the rewrite.

### Env (never commit real secrets)

| Name | Purpose |
|------|---------|
| `SESSION_SECRET` | HMAC key for session token hash; ≥ 32 chars |
| `WEB_ORIGIN` | CSRF Origin allowlist (default `http://localhost:4000`) |
| `SEED_ADMIN_EMAIL` `SEED_ADMIN_PASSWORD` `SEED_ADMIN_NAME` | Bootstrap Admin |
| `SEED_DH_RIVON_EMAIL` `SEED_DH_RIVON_PASSWORD` `SEED_DH_RIVON_NAME` | Rivon DH |
| `SEED_DH_ROVER_*` | Rover DH |
| `SEED_DH_ASSIDUA_*` | Assidua DH |

`.env.example` and CI get **local/test placeholders only**. Seed refuses to run if Admin or any DH password is missing or `< 8`.

### Error codes

| Code | When |
|------|------|
| `UNAUTHORIZED` | No/invalid/expired session on a protected route |
| `FORBIDDEN` | Authenticated but not Admin (user admin or taxonomy mutate/UI) |
| `INVALID_CREDENTIALS` | Login email/password/inactive |
| `PASSWORD_TOO_SHORT` | Create/reset password length `< 8` |
| `EMAIL_DUPLICATE` | Unique email conflict |
| `LAST_ADMIN` | Deactivate or demote would leave zero active Admins |
| `SOLE_DH_VACATE` | DH deactivate/role-change would leave the department with zero active DHs |
| `DH_ALREADY_ASSIGNED` | Second active DH without `dh-replace` |
| `ROLE_CONFLICT` | Admin+DH combo or implied second role |
| `DH_DEPARTMENT_REQUIRED` | `DEPARTMENT_HEAD` without existing `departmentId` |
| `DEPARTMENT_NOT_ALLOWED` | Non-DH with `departmentId` |
| `VALIDATION` | Blank name/email; unknown id; replace payload missing fields |

Reuse taxonomy `{ code, message }` 4xx shape. Duplicate the small helper in `identity` (rule-of-three: do not extract a shared error kit yet).

### Principal DTO (`GET /auth/me` and list/create/patch responses)

```text
{ id, email, name, role, departmentId, active }
```

`departmentId` is `null` unless role is `DEPARTMENT_HEAD`. Never include `passwordHash` or session tokens.

### DH replace payload

```text
POST /api/staff-users/dh-replace
{
  departmentId,
  incomingUserId,
  outgoingUserId,
  outgoingRole: "FRONT_DESK" | "COORDINATOR" | "ADMIN" | null,
  outgoingActive: boolean
}
```

Rules: `incomingUserId ≠ outgoingUserId`; outgoing is the current active DH for `departmentId`; incoming becomes that DH (active); if `outgoingActive === false`, `outgoingRole` is ignored for occupancy (user inactive, not a DH); if outgoing stays active, `outgoingRole` must be a non-DH role; last-Admin still applies if outgoing was Admin (they are DH, so not Admin) or if incoming was the last Admin being moved to DH. One Prisma transaction: outgoing first, then incoming, so the partial unique index never sees two active DHs.

### Mutation rules (service)

- Trim name/email; email lowercase; reject empty.
- Role is exactly one enum value; reject assigning Admin to a current DH (or DH to a current Admin) except via a single resulting role (including replace).
- `departmentId` required iff role is `DEPARTMENT_HEAD`; must exist (F-001 department).
- Create DH rejected if that department already has an active DH (`DH_ALREADY_ASSIGNED`) — use replace.
- Deactivate/role-change of a department’s only active DH → `SOLE_DH_VACATE`.
- Deactivate/role-change that would leave zero active Admins → `LAST_ADMIN`.
- Deactivating a non-DH does not run DH occupancy rules.
- PATCH password omitted → keep hash; present → re-hash if ≥ 8.
- Concurrent dual-DH: unique index fails the loser (NFR-6 last-write-wins + constraint).

### Audit writes (same transaction as the user change)

| Action string | When |
|---------------|------|
| `STAFF_USER_CREATED` | Create |
| `STAFF_USER_EDITED` | Profile/password/active without role change |
| `STAFF_USER_ROLE_CHANGED` | Role and/or DH department change (not via replace endpoint) |
| `STAFF_USER_DEACTIVATED` | `active: false` |
| `STAFF_DH_REPLACED` | Replace endpoint (one row; entity = department; refs in metadata) |

Columns: `actorUserId`, `at`, `action`, `entityType`, `entityId`, `departmentId?`, `metadata` JSON. Login/logout are **not** required by I17 — do not write them.

---

## Acceptance criteria (this slice)

From the spec, observable now:

- Seed: Rivon, Rover, Assidua each have exactly one active DH; at least one Admin exists who is not a DH.
- Active user + valid password → session cookie; `GET /auth/me` returns id, role, `departmentId` if DH.
- Invalid password, unknown email, or inactive user → no cookie; `INVALID_CREDENTIALS`.
- Logout → later `/auth/me` and taxonomy GET are 401.
- No cookie → user-admin and taxonomy HTTP are 401.
- Last active Admin cannot be deactivated or demoted.
- Second role / Admin+DH illegal combo rejected.
- Sole-DH vacate without replace rejected; one-step replace leaves exactly one active DH.
- Second active DH without replace rejected.
- Non-Admin user-admin HTTP → 403; Playwright: non-Admin denied Users UI.
- Admin creates FD (password ≥ 8) → that user signs in and is not DH/Admin.
- User/role changes persist an `AuditEntry` (query table in tests; no UI).
- `X-Test-Role` is **gone**; production-like `NODE_ENV` has no header bypass (nothing to ignore).
- `/taxonomy` as Admin uses the session; Playwright taxonomy logs in as seed Admin.

---

## Implementation steps

### 1. Prisma models + migration

Goal: `StaffUser`, `StaffSession`, `AuditEntry` exist; partial unique one-active-DH applies.  
Files: `apps/api/prisma/schema.prisma`; new migration under `apps/api/prisma/migrations/`  
Existing pattern: F-001 `Department` / `CategoryNode`  
Change: models as in Data below; raw SQL unique index `WHERE role = 'DEPARTMENT_HEAD' AND active = true` on `departmentId`; `StaffUser.departmentId` FK to `Department` (nullable). No Job.  
Dependencies: F-001 on `main`  
Validation: `pnpm db:migrate`  
Risk: High (credentials + unique DH)

### 2. Crypto + cookie helpers

Goal: hash passwords and sessions without new dependencies.  
Files: `apps/api/src/identity/password.ts`; `apps/api/src/identity/session-token.ts`  
Existing pattern: none (stdlib only)  
Change: scrypt hash/verify; 16-byte salt; 128-bit random session token; HMAC-SHA256 with `SESSION_SECRET`; parse/serialize `Cookie` / `Set-Cookie` by hand. Missing/short `SESSION_SECRET` → refuse to start the API (throw at bootstrap).  
Dependencies: none  
Validation: unit tests: known password verifies; wrong password fails; HMAC round-trip  
Risk: High (get hashing wrong)

### 3. Auth HTTP (login / logout / me)

Goal: session establish and end.  
Files: `apps/api/src/identity/identity.{module,controller,service,repository,errors,guard}.ts`; register in `app.module.ts`; `apps/api/src/main.ts` if cookie parser hook is needed (prefer reading `Cookie` in the guard)  
Existing pattern: taxonomy module layout; health is public  
Change: public login; guards attach principal from session row + user; expired row → 401 and delete; `AdminGuard` 403. CORS not added (rewrite).  
Dependencies: steps 1–2  
Validation: HTTP tests in step 6  
Risk: High

### 4. Staff user admin + DH replace + audit

Goal: spec user/role rules + audit rows.  
Files: same identity files; `apps/api/src/audit/audit.{service,repository,module}.ts`  
Existing pattern: taxonomy service owns rules; repository owns Prisma  
Change: list/create/patch/replace; transactional replace; audit append in the same `$transaction`. Taxonomy does not call audit.  
Dependencies: step 3  
Validation: service tests in step 6  
Risk: High (sole-DH / last-Admin)

### 5. Seed + env

Goal: M35 + bootstrap Admin; CI/local can log in.  
Files: `apps/api/src/identity/identity.seed.ts`; `apps/api/prisma/seed.ts`; `.env.example`; `.github/workflows/ci.yml`  
Existing pattern: `seedTaxonomy` then return  
Change: `seedIdentity` after taxonomy; find-or-create by email; skip password update if user exists; fail loud if env missing. CI sets the placeholder secrets.  
Dependencies: step 1  
Validation: seed twice; still one Admin, one DH per named department  
Risk: Medium (secret handling)

### 6. API tests

Goal: AC that does not need a browser.  
Files: `apps/api/src/identity/*.spec.ts`; `apps/api/test/identity.e2e.spec.ts`; update `apps/api/test/taxonomy.e2e.spec.ts` and delete `taxonomy.guard.spec.ts` header cases  
Existing pattern: vitest + Nest testing + supertest; taxonomy HTTP `beforeAll` seed  
Change: login helper extracts `set-cookie`. Cases: login/me/logout; inactive denied; last Admin; sole DH; replace; second DH; Admin≠DH; 403 non-Admin; 401 no cookie; audit row after role change; taxonomy GET 401 without session and 200 with Admin cookie. **Create a FD user in tests** (seed has Admin + DHs only).  
Dependencies: steps 3–5  
Validation: `pnpm test`  
Risk: Medium

### 7. Delete `X-Test-Role`

Goal: one auth path.  
Files: `apps/api/src/taxonomy/taxonomy.guard.ts` (replace with re-export of identity guards or delete and import identity); `apps/web/app/taxonomy/page.tsx`; `e2e/taxonomy.spec.ts`; `README.md`  
Existing pattern: taxonomy `@UseGuards(TaxonomyGuard, AdminGuard)`  
Change: `AuthGuard` from identity on taxonomy controller; page `credentials: "include"`; no header in production or dev; Playwright logs in as seed Admin before `/taxonomy`.  
Dependencies: steps 3, 5  
Validation: taxonomy unit tests still pass; HTTP 401 without cookie  
Risk: High (break F-001 if guard wiring is wrong)

### 8. Staff UI

Goal: approved UI contract.  
Files: `apps/web/app/login/page.tsx`; `apps/web/app/home/page.tsx`; `apps/web/app/staff-users/page.tsx`; `apps/web/app/forbidden/page.tsx`; `apps/web/app/staff-shell.tsx` (or layout under a route group that does **not** wrap `/` or `/login`); taxonomy page uses the shell  
Existing pattern: client taxonomy page + dialogs  
Change: login form; shell nav (Home all staff; Taxonomy + Users Admin only); users table + dialogs including Replace DH; forbidden copy. Do not add shadcn Table/Select. `/` unchanged.  
Dependencies: step 3  
Validation: `pnpm --filter web typecheck`; manual login  
Risk: Medium

### 9. Playwright identity + taxonomy login

Goal: spec E2E + F-001 e2e without the header.  
Files: `e2e/identity.spec.ts`; `e2e/taxonomy.spec.ts`; `e2e/helpers/login.ts`  
Existing pattern: `e2e/smoke.spec.ts`; taxonomy spec  
Change: helper fills `/login`. Cases: Admin creates FD → logout → FD signs in (lands `/home`); FD cannot open Users; sole-DH deactivate rejected; replace DH succeeds. Taxonomy spec uses Admin login instead of `setExtraHTTPHeaders`. Smoke still hits `/` with no session.  
Dependencies: steps 5, 8  
Validation: `pnpm test:e2e`  
Risk: Medium

### 10. README

Goal: human can seed env and sign in locally.  
Files: `README.md` Runtime section only (do not mix studio-move leftovers)  
Existing pattern: F-001 runtime notes  
Change: document seed env vars; `/login`; `/staff-users`; **remove** `X-Test-Role` instructions.  
Dependencies: steps 5, 8  
Validation: instructions match scripts  
Risk: Low

---

## Files / components (target)

```text
apps/api/prisma/schema.prisma
apps/api/prisma/migrations/<timestamp>_identity/
apps/api/prisma/seed.ts
apps/api/src/identity/identity.module.ts
apps/api/src/identity/identity.controller.ts
apps/api/src/identity/identity.service.ts
apps/api/src/identity/identity.repository.ts
apps/api/src/identity/identity.guard.ts
apps/api/src/identity/identity.errors.ts
apps/api/src/identity/identity.seed.ts
apps/api/src/identity/password.ts
apps/api/src/identity/session-token.ts
apps/api/src/identity/identity.service.spec.ts
apps/api/src/identity/password.spec.ts
apps/api/test/identity.e2e.spec.ts
apps/api/src/audit/audit.module.ts
apps/api/src/audit/audit.service.ts
apps/api/src/audit/audit.repository.ts
apps/api/src/taxonomy/taxonomy.guard.ts      # delete header path; use identity
apps/api/test/taxonomy.e2e.spec.ts           # cookie instead of header
apps/web/app/login/page.tsx
apps/web/app/home/page.tsx
apps/web/app/staff-users/page.tsx
apps/web/app/forbidden/page.tsx
apps/web/app/staff-shell.tsx
apps/web/app/taxonomy/page.tsx               # credentials; no X-Test-Role
e2e/helpers/login.ts
e2e/identity.spec.ts
e2e/taxonomy.spec.ts
.env.example
.github/workflows/ci.yml
README.md
docs/specs/AO-F-002-staff-identity.md        # UI contract (this PLAN)
docs/specs/AO-MVP-001-feature-breakdown.md   # status after IMPLEMENT, not now
```

Do not create `packages/`, jobs, tech-link auth, or an audit UI.

---

## Data / API / authorization

**Data**

- `StaffUser`: id, email (unique), name, role enum (`FRONT_DESK` \| `COORDINATOR` \| `DEPARTMENT_HEAD` \| `ADMIN`), departmentId? (FK), active, passwordHash, timestamps  
- `StaffSession`: id, staffUserId, tokenHash (unique), expiresAt, createdAt  
- `AuditEntry`: id, at, actorUserId?, action, entityType, entityId, departmentId?, metadata Json?

**API** (global prefix `api` already set)

| Method | Path | Authz |
|--------|------|-------|
| POST | `/auth/login` | Public |
| POST | `/auth/logout` | Authenticated staff |
| GET | `/auth/me` | Authenticated staff |
| GET | `/staff-users` | Admin |
| POST | `/staff-users` | Admin |
| PATCH | `/staff-users/:id` | Admin |
| POST | `/staff-users/dh-replace` | Admin |

Taxonomy routes: any authenticated staff GET; Admin mutations — **session**, not header.

**Authorization:** Nest guards + identity service policies. UI hide is not security.

---

## Testing

| Check | Asserts |
|-------|---------|
| Seed | Admin exists; one active DH each for Rivon/Rover/Assidua; Admin is not a DH |
| Password unit | scrypt verify; short password rejected on create |
| Service | last Admin; sole DH; replace; second DH; Admin≠DH; inactive login |
| HTTP session | login sets cookie; me; logout 401; no cookie 401 |
| HTTP authz | Admin user-admin 200; FD/DH/Coordinator 403 |
| Audit | role change inserts `AuditEntry` |
| Taxonomy HTTP | 401 without cookie; Admin cookie can GET/mutate |
| Playwright | create FD → that user signs in; sole-DH vacate rejected; replace succeeds; non-Admin denied Users; taxonomy still works via login |
| CI | existing lint/typecheck/test/e2e plus identity env |

---

## Migration impact

One additive migration on top of taxonomy. Empty-of-users DBs migrate forward; seed creates users. No backfill. Existing local DBs that used only taxonomy keep working after migrate + seed. **Breaking:** `X-Test-Role` stops working; browsers and Playwright must log in.

CI must set `SESSION_SECRET` and seed credentials before `prisma db seed` and e2e.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Cookie not applied through Next rewrite | Set one cookie; Playwright + manual check on `:4000`; HTTP tests hit Nest directly with `Cookie` header |
| `SESSION_SECRET` missing in prod | Refuse API boot; document in README; CI dummy value |
| Seed overwrites a rotated local Admin password | Find-or-create by email; never update hash if user exists |
| Last-Admin / sole-DH holes | Service tests + partial unique index + Playwright |
| Audit module scope creep | Writes only; no list endpoint; F-012 owns reads/UI |
| Taxonomy e2e red after header removal | Login helper first in taxonomy spec |
| Deploy API with leftover header code | Delete `readTestRole`; grep CI/tests for `X-Test-Role` must be empty |
| CSRF on JSON POST | SameSite=Lax + Origin allowlist; no third-party staff UI in MVP |
| Stolen cookie until 12h | HttpOnly; HTTPS Secure in production; logout deletes row; idle timeout later |

---

## Alternatives rejected

| Alternative | Why not |
|-------------|---------|
| Keep `X-Test-Role` in test env beside sessions | Two auth paths; F-001 already named deletion as the upgrade |
| JWT in cookie, no session table | Logout needs a denylist; spec wants a server-recognized session |
| bcrypt / argon2 | Extra native dependency; stdlib scrypt is enough for MVP |
| cookie-parser / express-session | One small Cookie parser; we own expiry in Postgres |
| Fold DH replace into PATCH | Payload on a single `:id` cannot atomically change two users |
| Next Auth / Clerk / iron-session | ADR-002 first-party in `identity`; Nest is authz source of truth |
| Idle 30 minutes | Extra write on every request; not a frozen business rule |
| Staff home replacing `/` | Would break ENG-000 smoke |
| Extract shared HTTP error helper | Only two modules; wait for rule-of-three |

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
# http://localhost:4000/login
# http://localhost:4000/taxonomy          (Admin after sign-in)
# http://localhost:4000/staff-users       (Admin)
```

---

## Human approval

**Stop point.** Auth is high-risk. No production code until this PLAN (and the UI contract in the spec) is approved.

- [x] Approve AO-F-002 UI contract + PLAN as written — **HUMAN APPROVED 2026-08-18**
- [ ] Approve with amendments: _______________________
- [ ] Reject / replan

Suggested confirmations (engineering, not new business rules):

1. HTTP-only cookie + Postgres session row; **12h absolute**; no idle timeout  
2. `node:crypto.scrypt`; `SESSION_SECRET` HMAC; seed passwords from env only  
3. Delete `X-Test-Role` in this slice (taxonomy uses sessions)  
4. Dedicated `POST /staff-users/dh-replace`; audit **writes** without a viewer  
5. `/login` `/home` `/staff-users` `/forbidden`; `/` stays public; Admin post-login → `/taxonomy`  
