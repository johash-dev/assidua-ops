# AO-F-002 — Staff identity

**Feature ID:** AO-F-002  
**Parent:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED); ADR-002, ADR-007  
**Breakdown:** `docs/specs/AO-MVP-001-feature-breakdown.md`  
**Depends on:** AO-F-001 (Department for DH assignment)  
**Status:** HUMAN APPROVED (2026-08-12)  
**Module:** `identity`

---

## Objective

Provide first-party staff authentication (session cookies) and Admin-managed staff users with exactly one role each, including sole-DH / dual-DH and Admin≠DH rules — so NestJS can authorize all later features (NFR-4).

---

## Business context

Front Desk, Coordinators, Department Heads, and Admins use the staff app. Technicians have **no** staff login (ADR-007). Admins provision accounts. Exactly one DH per department; Admin and DH are mutually exclusive; each user has exactly one role (I44 / I50 / I34 / I38). Go-live requires three DHs assigned (M35).

---

## User story

As an Admin, I create and manage staff accounts and roles (including one-step DH replacement) so each person can sign in with the correct single role. As any staff user, I sign in and out and reach only what my role allows at the API boundary.

---

## Functional requirements

### Authentication & session

- FR-I1: Staff authenticate via **first-party email + password** in the `identity` module (ADR-002 option **A**; locked 2026-08-12). No magic link, Clerk/Auth0, or SSO in MVP.
- FR-I2: Successful auth establishes a **server-recognized staff session** used by the Next.js staff app (session cookies). NestJS is the authorization source of truth (NFR-4).
- FR-I3: Authenticated staff may end their session (logout). Unauthenticated requests to staff APIs are rejected.
- FR-I4: Technician shareable-link access is **out of scope** here (AO-F-006 / ADR-007).
- FR-I1a: Passwords stored as one-way hashes only; minimum length **≥ 8**. No further complexity rules in MVP. **No self-service password reset** in MVP — Admin sets/resets password on the user record.
- FR-I1b: Bootstrap: seed creates initial Admin (and M35 DHs) using credentials from **environment variables** (never committed). Admin create/edit user includes setting an initial or new password.
- FR-I1c: Reject deactivate or role-change that would leave **zero active Admins**.

### Staff user & role administration

- FR-I5: Admins only manage staff users: create, edit profile fields needed for login/identity, assign **exactly one** role, activate/deactivate (FR-7.1; Auth table).
- FR-I6: Roles (enum): `FRONT_DESK` | `COORDINATOR` | `DEPARTMENT_HEAD` | `ADMIN`. Org title labels for Admins are **not** separate roles (Decision 6 / I13).
- FR-I7: Assigning a second staff role to a user who already has one is rejected (I50).
- FR-I8: Admin and DH are mutually exclusive — assigning Admin to a current DH (or DH to a current Admin) without removing the other in the same allowed transition is rejected (I44). Practical rule: a user may not hold both; role changes must result in exactly one role.
- FR-I9: `DEPARTMENT_HEAD` requires exactly one `departmentId` referencing an existing department (AO-F-001). Non-DH roles must not carry a DH department assignment.
- FR-I10: Exactly one **active** DH per department (I34 / I38):
  - Reject leaving a department with zero active DHs (deactivate or role-change that would vacate without replacement).
  - Reject assigning a second active DH to a department unless the change is a **one-step replacement** (same transaction: outgoing DH removed/role-changed/deactivated and incoming user becomes that department’s DH).
- FR-I11: Seed / go-live checklist: three departments each have an active DH before production use (M35). Seed creates bootstrap Admin + three DH users from env credentials (never commit production secrets).
- FR-I12: Non-Admin roles cannot manage staff users.

### Audit emit

- FR-I13: Staff user/role changes **must** append audit events (I17). Audit **view UI** is AO-F-012; this feature must write append-only audit records (via `audit` persistence helper/service) for create/edit/role/deactivate/DH-replacement events. Notification-setting and taxonomy changes remain non-required.

### Authorization foundation for other features

- FR-I14: Expose a NestJS-readable principal: user id, role, departmentId (if DH), active flag — so later features enforce the Auth capability table. This feature does **not** implement job/customer/report authorization beyond identity/user admin routes.

---

## Non-functional requirements

- NFR-4: Server-side authorization; UI never trusted.
- NFR-5: Password hashes never stored reversible; session secrets in env; never commit credentials.
- Passwords: store only strong one-way hashes (algorithm is implementation detail, not a business rule).

---

## Acceptance criteria

### Login / session

- Given an active staff user with valid email + password, when they complete sign-in, then a staff session is established and `GET` of current user returns id, role, and departmentId if DH.
- Given invalid email/password or inactive user, when they attempt sign-in, then sign-in is rejected and no session is established.
- Given Admin attempts to deactivate or demote the last active Admin, when saving, then the change is rejected.
- Given an authenticated staff user, when they logout, then subsequent staff API calls without a new sign-in are rejected.
- Given no session, when calling Admin user-management APIs, then the request is rejected.

### Single role / Admin≠DH

- Given a user with the Admin role (any title label), when using the app, then permissions match other Admin-role users (baseline AC).
- Given admin attempts to assign Admin role to a current DH (or DH role to a current Admin) without a valid single-role outcome, when saving, then the change is rejected.
- Given admin attempts to assign a second staff role to a user who already has Front desk, Coordinator, DH, or Admin, when saving, then the change is rejected (one role per user).

### Sole / dual DH

- Given a department has exactly one active DH, when admin attempts to deactivate that user or change their role so the department would have zero DHs without assigning a replacement DH in the same change, then the change is rejected.
- Given a department already has an active DH, when admin attempts to assign a second user as DH for that department without replacing the first in the same change, then the change is rejected.
- Given admin assigns a different staff user as that department’s DH in the same change (one-step replacement), when saving, then the previous sole-DH removal/role-change is allowed and exactly one active DH remains for that department.

### Admin-only user admin

- Given DH, Front Desk, or Coordinator, when they attempt staff user create/edit/role/deactivate, then the change is rejected.
- Given Admin, when they create an active Front Desk user with password ≥ 8, then that user can sign in with email + password and is not a DH/Admin.

### Audit write

- Given admin completes a user-role change, when audit storage is queried (or later Admin audit UI in F-012), then a staff user/role change event exists (I17). Exact audit DTO shape locked in F-012; F-002 must persist actor, timestamp, action, entity refs, and departmentId when applicable for DH scoping.

### Go-live seed

- Given seed applied for production-like setup, when checking departments from AO-F-001, then each of Rivon, Rover, and Assidua has exactly one active DH (M35), and at least one Admin exists who is not a DH (I44).

---

## User-visible behavior

- Sign-in and logout screens for staff (UX copy not frozen; must not claim SSO).
- Admin: staff user list/create/edit; role select; DH department select; deactivate; one-step DH replacement UX (single save that swaps).
- Non-Admin: no user-admin UI.
- Inactive users cannot sign in.

---

## API behavior

Internal NestJS HTTP API. Paths illustrative; behavior locked:

| Method | Resource | Authz | Behavior |
|--------|----------|-------|----------|
| POST | `/auth/login` | Public | Email + password; establishes session |
| POST | `/auth/logout` | Authenticated staff | Ends session |
| GET | `/auth/me` | Authenticated staff | Principal: id, email, name, role, departmentId?, active |
| GET | `/staff-users` | Admin | List staff users |
| POST | `/staff-users` | Admin | Create (role, email, name, password ≥ 8, departmentId if DH) |
| PATCH | `/staff-users/:id` | Admin | Edit; optional password reset; role/department/active subject to FR-I7–I10 / FR-I1c; support one-step DH replacement payload |
| POST | `/staff-users/dh-replace` (optional dedicated) | Admin | Equivalent one-step replacement if not folded into PATCH |

Session transport: HTTP-only cookie (or equivalent cookie session) for browser staff app; CSRF strategy is an implementation PLAN detail under security review, not a business invention.

---

## Data behavior

- `StaffUser`: id, email (unique), name, role (exactly one), departmentId (required iff DH), active, passwordHash, timestamps.
- Partial unique: at most one active DH per `departmentId`.
- Append-only `AuditEntry` rows for user/role changes (shared audit store; F-012 reads them).
- Customers/jobs/technicians unchanged.
- No technician StaffUser rows.

---

## Authorization

| Action | Admin | DH | Front desk | Coordinator | Tech link |
|--------|-------|----|------------|-------------|-----------|
| Sign in (own account) | Yes | Yes | Yes | Yes | No |
| Manage staff users / roles / DH replacement | Yes | No | No | No | No |
| `GET /auth/me` | Yes | Yes | Yes | Yes | No |

Broader Auth capability table (jobs, reports, etc.) enforced in later features using this principal.

---

## Error states

- Invalid / inactive credentials → rejected.
- Unauthenticated staff API → rejected.
- Non-Admin user admin → rejected.
- Second role / Admin+DH illegal combo → rejected.
- Vacate sole DH without replacement → rejected.
- Second DH without one-step replacement → rejected.
- DH without departmentId / non-DH with departmentId → rejected.
- Duplicate email → rejected.

---

## Edge cases

- One-step replacement: outgoing DH may become Front Desk / Coordinator / Admin / inactive in the same transaction as incoming becomes DH.
- Deactivating a non-DH user succeeds without DH rules.
- Last active Admin cannot be deactivated or demoted (FR-I1c).
- Concurrent two Admins assigning different DHs: last-write-wins (NFR-6) but unique constraint must still yield ≤1 active DH; loser request fails.
- Title/label fields if shown are cosmetic only.

---

## Dependencies

- AO-F-001 departments exist (for DH `departmentId` and M35 seed).
- AO-ENG-000 platform (Next.js + NestJS + Prisma + env secrets).
- No email adapter required for login (Admin-set passwords).
- Audit persistence available for FR-I13 writes.

---

## Constraints

- No technician login (MVP out of scope).
- No IdP subscription (ADR-002).
- Exactly one role per user; Admin≠DH; one active DH per department.
- Do not invent SSO, MFA, or password-complexity product rules beyond secure hashing / token hygiene.
- Do not implement job/customer authorization matrices here beyond exposing the principal.

---

## Out of scope

- Technician token auth (AO-F-006)
- Notification settings, taxonomy admin (other features)
- Full Auth capability enforcement for jobs/reports/audit UI
- Audit log **viewer** (AO-F-012)
- SSO / SAML / OAuth social login
- Customer-facing accounts

---

## Test requirements

- Unit/integration: I50, I44, I38 sole/dual DH + one-step replacement transaction; inactive login denied; Admin-only user admin.
- Integration: session establish/logout; unauthenticated 401.
- Playwright: Admin creates FD user → that user signs in; sole-DH vacate rejected; one-step replacement succeeds; non-Admin denied user admin.
---

## Definition of Done

- [x] Human approves this spec **including auth mechanism decision**.
- [ ] PLAN approved; implementation meets AC above.
- [ ] Feature-owned tests + applicable E2E green.
- [ ] Build/type/lint clean; security review for auth/session/secrets.
- [ ] Seed path satisfies M35 + bootstrap Admin without committed secrets.
- [ ] Breakdown row AO-F-002 → Approved/Complete when done.

---

## Open questions / human decisions

Resolved by human approval “Approved. Continue.” (2026-08-12), applying ADR-002 option A and recommended guards:

1. **Auth mechanism:** **A** — email + password. No magic link. No self-service reset (Admin sets/resets password).
2. **Bootstrap / invite:** Seed Admin (+ M35 DHs) from **env credentials**; Admin sets initial/new password on user create/edit.
3. **Last Admin:** **Reject** deactivate/demote of last active Admin.
4. **Session lifetime:** PLAN documents idle/absolute timeouts (not a frozen business rule).
5. **Password policy:** Minimum length ≥ 8; no further complexity rules.

Amend via explicit change if any of the above is wrong.

---

## Human approval

**Approved (2026-08-12).** PLAN may proceed for AO-F-002 (after AO-ENG-000 / AO-F-001 as needed). No production code in this artifact.
