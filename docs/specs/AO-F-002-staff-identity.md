# AO-F-002 — Staff identity

**Feature ID:** AO-F-002  
**Parent:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED); ADR-002, ADR-007  
**Breakdown:** `docs/specs/AO-MVP-001-feature-breakdown.md`  
**Depends on:** AO-F-001 (Department for DH assignment)  
**Status:** HUMAN APPROVED (2026-08-12); **UI contract:** HUMAN APPROVED (2026-08-18); **PLAN:** HUMAN APPROVED (2026-08-18)  
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

## UI contract

**Drafted:** 2026-08-18  
**Status:** HUMAN APPROVED (2026-08-18) — list + dialogs; Save stays on `/staff-users`; staff shell this slice; `/` stays public

### Screens / routes

| Route | Purpose |
|-------|---------|
| `/login` | Public sign-in (email + password). No staff chrome. |
| `/home` | Signed-in landing: name + role. All staff. No dashboard widgets. |
| `/staff-users` | Admin list of staff users; create/edit/deactivate/DH-replace in dialogs. |
| `/taxonomy` | Existing Admin tree; wrap in staff shell (no taxonomy behavior change). |
| `/forbidden` | Authenticated staff who opened a page their role cannot use. |
| `/` | ENG-000 smoke/health. Stays **public**. Not a staff home. |

No `/logout` page (shell control). No per-user `/staff-users/:id` routes. No non-Admin user-admin page. No technician login.

### Primary flows

1. **Sign in:** Open `/login` → email + password → Submit. Success: HTTP-only session cookie; Admin → `/taxonomy`; other staff → `/home`. Invalid/inactive: stay on `/login`, show one generic error. No SSO copy.
2. **Log out:** Staff chrome **Log out** → `POST /auth/logout` → cookie cleared → `/login`.
3. **Session missing:** Direct `/home`, `/staff-users`, or `/taxonomy` → `/login` (return URL not required in MVP).
4. **View users (Admin):** Open `/staff-users` → table of seed + created users: name, email, role, department (DH only), Active/Inactive. Stay on page.
5. **Create user:** **Add user** → name, email, password (≥ 8), role; if role is Department head, department required (Rivon/Rover/Assidua + later depts). Save → stay on `/staff-users`; new row visible.
6. **Edit user:** **Edit** → name, email, optional new password, role, department if DH, active. Save → stay. Last-Admin / sole-DH / Admin≠DH / duplicate email → in-dialog or in-page alert from API `message`.
7. **Deactivate:** Row **Deactivate** → confirm → on success shows Inactive; on last-Admin or sole-DH vacate, show server error and leave Active.
8. **One-step DH replacement:** **Replace DH** (on a department that already has an active DH, or from the Users page) → pick incoming user + outgoing destination (Front desk / Coordinator / Admin / Inactive) → single Save → exactly one active DH remains for that department; stay on `/staff-users`.
9. **Non-Admin:** No Users nav. Direct `/staff-users` → `/forbidden`. Direct `/taxonomy` → `/forbidden` (closes F-001 deferred access-denied).
10. **Tech link:** No identity UI.

### Role matrix

| Chrome / action | Admin | DH | FD | Coordinator | Tech link |
|-----------------|-------|----|----|-------------|-----------|
| `/login` | Yes (signed-out) | Yes | Yes | Yes | **No** |
| Staff chrome: name + role + Log out | Yes | Yes | Yes | Yes | — |
| Nav: Home | Yes | Yes | Yes | Yes | — |
| Nav: Taxonomy | Yes | **No** | **No** | **No** | — |
| Nav: Users | Yes | **No** | **No** | **No** | — |
| Open `/home` | Yes | Yes | Yes | Yes | — |
| Open `/taxonomy` | Tree | Forbidden | Forbidden | Forbidden | — |
| Open `/staff-users` | List | Forbidden | Forbidden | Forbidden | — |
| Create / edit / deactivate / replace DH | Yes | **Hidden** | **Hidden** | **Hidden** | — |

Server authz remains the boundary; hidden nav is UX only.

### States

| Screen | Empty | Loading | Validation | Error | Success |
|--------|-------|---------|------------|-------|---------|
| Login | Form | Submit pending | Email and password required | Generic sign-in rejected (invalid, inactive, or unknown) | Redirect as in flow 1 |
| Home | Name + role | Spinner until `/auth/me` | — | Session missing → `/login` | — |
| Users list | “No staff users” + Add user (seeded env is not empty) | Table spinner | — | Load failure | — |
| Create/Edit dialog | — | Submit pending | Inline: name/email required (trim); password ≥ 8 on create and when provided on edit; DH requires department | Server rejects (duplicate email, last Admin, sole DH, Admin≠DH, non-Admin) as in-dialog or in-page alert | Close dialog; list refreshed; stay on `/staff-users` |
| Deactivate confirm | — | Submit pending | — | Last-Admin / sole-DH from API; user stays active | Close; list refreshed |
| Replace DH dialog | — | Submit pending | Incoming user and outgoing destination required | Second-DH / vacate / last-Admin from API | Close; list refreshed |
| Forbidden | — | — | — | “You do not have access to this page.” + Log out | — |

### Copy constraints

- Labels from fields/spec only: Email, Password, Name, Role, Department, Active, Inactive, Sign in, Log out, Users, Taxonomy.
- Role labels: Front desk, Coordinator, Department head, Admin (enum values stay `FRONT_DESK` etc. on the API).
- Login must **not** mention SSO, magic link, or “forgot password”.
- Inactive cannot sign in — do not explain “inactive” vs “wrong password” on `/login`.
- No audit history on these screens (viewer is AO-F-012).
- No technician-login copy.

### Reuse

- Look & feel: **ADR-009**. Existing `Button`, `Input`, `Dialog`, `AlertDialog`, `Alert`. Native `<select>` for role/department (same as taxonomy). Native `<table>` for the user list (rule-of-three).
- Staff shell is **this** slice (F-001 deferred it). Taxonomy page drops `X-Test-Role` and uses `credentials: "include"`.
- Shared PageHeader / EmptyState: **not** extracted.

### Out of UI scope

- Technician token login (AO-F-006)
- Customer accounts
- Self-service password reset, MFA, SSO
- Audit log viewer (AO-F-012)
- Job/customer/report chrome
- Remember-me, session-list, “log out everywhere”
- Title/org-label fields (not roles)

### Open questions / human decisions (UI)

1. List + dialogs vs `/staff-users/new` routes? → **list + dialogs** (proposed with PLAN).
2. After login, Admin destination? → **`/taxonomy`**.
3. After login, non-Admin destination? → **`/home`** (name + role; no dashboard).
4. DH replace UX? → **dedicated dialog, one Save** (matches one-step replacement AC).

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
- [x] UI contract human-approved.
- [x] PLAN approved.
- [x] Implementation meets AC above.
- [x] Feature-owned tests + applicable E2E green.
- [x] Build/type/lint clean.
- [ ] Independent security review for auth/session/secrets.
- [x] Seed path satisfies M35 + bootstrap Admin without committed secrets.
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

**Spec approved (2026-08-12)** as written.

**Stop point — UI contract.** No PLAN / production UI until this contract is approved (may be approved together with the PLAN).

- [x] Approve AO-F-002 UI contract as written — **HUMAN APPROVED 2026-08-18**
- [ ] Approve with amendments: _______________________
- [ ] Reject / replan UI contract
