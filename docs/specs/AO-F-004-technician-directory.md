# AO-F-004 — Technician directory

**Feature ID:** AO-F-004  
**Parent:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED)  
**Breakdown:** `docs/specs/AO-MVP-001-feature-breakdown.md`  
**Depends on:** AO-F-001 (departments), AO-F-002 (staff roles)  
**Status:** HUMAN APPROVED (2026-08-12)  
**Module:** `technicians`  
**Deferred gate:** **I56** — DH vs Admin-only primary-department **change** (when no open jobs)

---

## Objective

Provide an Admin/DH-managed technician directory (no login) so assignment can select technicians by primary department pool, with deactivate and primary-department change blocked while the technician has open jobs (B4, I53, FR-7.1–7.2).

---

## Business context

Technicians are directory entries (name, required phone, optional email, primary department) — not staff users. FD may view the directory read-only; Coordinators cannot view it (M5). Assignment/WhatsApp is AO-F-006.

---

## User story

As Admin (or DH for my department), I create and maintain technicians and deactivate them when appropriate so DH/Admin can later assign jobs from the correct pool.

---

## Functional requirements

- FR-D1: Technician entry: **name**, **required phone**, **optional email**, **primary department**, **active** flag. No login (baseline Technician model).
- FR-D2: Admins manage **all** technicians (create/edit/deactivate; set any primary department on create) (FR-7.1).
- FR-D3: DHs manage technicians in **their** department: create (primary department = own dept), edit name/phone/email, deactivate subject to FR-D5 (FR-7.2).
- FR-D4: **I56 GATE — primary department change:**
  - **Admin** may change a technician’s primary department when the technician has **no** open (non-Closed/Cancelled) jobs (I53 / FR-7.1).
  - **DH must not** be authorized to change primary department until I56 is decided via requirements change (architecture: block DH authz on that mutation). DH create with own department is allowed; moving a tech to another department is Admin-only for this slice.
- FR-D5: Deactivate is **blocked** while the technician has any open job (not Closed and not Cancelled) (B4).
- FR-D6: Front Desk: **read-only** directory view (all departments) (M5). Cannot create/edit/deactivate.
- FR-D7: Coordinator: **cannot** view or manage directory (M5).
- FR-D8: No hard seat cap on directory size (M9).
- FR-D9: Phone suitability validation deferred (**M45**) — store as entered.
- FR-D10: Technician directory changes append audit events (I17). Viewer = AO-F-012.
- FR-D11: Inactive technicians must not appear in assignment pools (enforced when AO-F-006 selects; this feature exposes `active` and list filters).

---

## Non-functional requirements

- NFR-4: Server-side role/department checks.
- Repository-only DB; rules in `technicians` service.

---

## Acceptance criteria

### Create / edit / read

- Given Admin, when they create a technician with name, phone, optional email, and primary department, then the technician is active and listed.
- Given DH, when they create a technician with primary department equal to their own department, then create succeeds.
- Given DH, when they attempt to create a technician with another department as primary, then create is rejected.
- Given FD, when they open the directory, then they can view technicians (read-only) and cannot mutate.
- Given Coordinator, when they attempt to list or mutate technicians, then access is rejected.
- Given missing name or phone (empty/whitespace), when save is attempted, then rejected.

### Deactivate / primary department

- Given a technician has an In Progress (or any open) job, when admin/DH attempts deactivate, then deactivate is rejected until that job is reassigned or Closed/Cancelled.
- Given a technician’s jobs are all Closed or Cancelled (or none), when admin/DH deactivates, then deactivate succeeds.
- Given a technician has an open job, when Admin attempts to change primary department, then the change is rejected (I53).
- Given a technician has no open jobs, when Admin changes primary department, then the change succeeds.
- Given a technician has no open jobs, when DH attempts to change primary department, then the change is **rejected** (I56 gate — Admin-only until requirements decide otherwise).

### Audit

- Given admin/DH completes a directory create/edit/deactivate (or Admin primary-dept change), when audit storage is queried, then a technician directory change event exists (I17).

---

## User-visible behavior

- Admin: full directory management UI.
- DH: manage own-department technicians; no primary-dept move control (or control disabled/hidden) until I56.
- FD: read-only directory.
- Coordinator: no directory navigation/API.

---

## UI contract

**UI in scope:** yes  
**Drafted:** 2026-08-13 (UI/UX Agent walkthrough)  
**Status:** HUMAN APPROVED (2026-08-13) — UI decisions: edit Save → list; filter default Active

### Screens / routes

| Route | Purpose |
|-------|---------|
| `/technicians` | Directory list |
| `/technicians/new` | Create form |
| `/technicians/[id]` | Edit (Admin/DH) or read-only detail (FD) |

No separate deactivate route — confirm in-place from list or detail. No assignment/WhatsApp UI here.

### Primary flows

1. **List → create (Admin/DH):** Open `/technicians` (filter default **Active**) → **New technician** → fill name, phone, optional email, primary department → Save → return to list with new row (active).
2. **List → edit (Admin/DH):** Open row → edit allowed fields → Save → **return to list** (HUMAN DECIDED).
3. **Deactivate (Admin/DH):** From list or detail → **Deactivate** → confirm → on success, row shows inactive; on open-job block, show server error and leave record active.
4. **Reactivate (Admin/DH):** On inactive tech → **Reactivate** (no open-job gate) → active again.
5. **Admin primary-department change:** On edit, change department control → Save; if open jobs, show server error and keep previous department.
6. **FD view:** Open `/technicians` (and optional row → read-only detail). No create/edit/deactivate controls.
7. **Coordinator:** No nav entry; direct URL → access denied (same as other forbidden staff pages).

### Role matrix

| Chrome / action | Admin | DH | FD | Coordinator |
|-----------------|-------|----|----|-------------|
| Nav: Technicians | Yes | Yes | Yes | **No** |
| List (scope) | All depts | Own dept only | All depts | — |
| Filter active/inactive (default **Active**) | Yes | Yes | Yes | — |
| New technician | Yes | Yes | **Hidden** | — |
| Open row | Edit form | Edit form (own dept) | Read-only | — |
| Name / phone / email fields | Editable | Editable | Read-only | — |
| Primary department on create | Any dept | **Fixed to own dept** (display only or single locked value) | — | — |
| Primary department on edit | Editable (subject to open-job reject) | **Hidden** (I56; show current dept as text) | Read-only text | — |
| Deactivate / Reactivate | Yes | Own-dept only | **Hidden** | — |

Server authz remains the boundary; hidden controls are UX only.

### States

| Screen | Empty | Loading | Validation | Error | Success |
|--------|-------|---------|------------|-------|---------|
| List | “No technicians” (DH: none in dept) | List skeleton/spinner | — | Load failure message | — |
| Create/Edit | — | Form loading on edit | Inline: name and phone required (trim whitespace) | Server rejects (incl. open-job deactivate/dept change, DH scope) as in-page alert | Save → return to list |
| Deactivate confirm | — | Submit pending | — | Open-job block message from API | Close dialog; list refreshed |
| Forbidden | — | — | — | Standard access-denied page for Coordinator (and DH outside scope if deep-linked) | — |

Phone format validation: **none** in UI beyond non-empty (M45).

### Copy constraints

- Labels from fields only: Name, Phone, Email (optional), Primary department, Active/Inactive.
- Deactivate confirm: state that the technician will leave assignment pools; do not invent policy text beyond FR-D5/B4.
- Open-job block: surface API/meaningful error (e.g. cannot deactivate / change department while open jobs exist) — exact string PLAN-owned if API already returns one.
- No marketing headlines; no “seat limit” copy (M9).

### Reuse

- Greenfield staff app: shared staff shell/nav from AO-F-002 when it exists; same list → form pattern as other admin directories (taxonomy/departments) when those land.
- Department select: reuse department list from AO-F-001.
- Look & feel: **ADR-009** (Tailwind + shadcn/`components/ui` + shared tokens) — no parallel visual system for this feature.

### Out of UI scope

- Assignment picker, WhatsApp, shareable links (AO-F-006)
- Audit log viewer (AO-F-012)
- Technician login / mobile app
- DH primary-department change control (I56)
- Phone suitability hints (M45)
- Search/sort beyond active filter unless PLAN finds an existing list pattern that includes them for free (do not add a search product)

### Open questions / human decisions (UI)

1. ~~After Save on edit: return to list vs stay on form?~~ → **return to list** (HUMAN DECIDED).
2. ~~List filter default Active vs All?~~ → **Active** (HUMAN DECIDED).

No remaining UI blockers.

---

## API behavior

| Method | Resource | Authz | Behavior |
|--------|----------|-------|----------|
| GET | `/technicians` | Admin, DH (own dept filter default), FD (all, read) | List; Coordinator denied |
| GET | `/technicians/:id` | Same as list scope | Detail |
| POST | `/technicians` | Admin (any dept); DH (own dept only) | Create |
| PATCH | `/technicians/:id` | Admin; DH if tech primary dept = DH dept | Edit name/phone/email; Admin may change `primaryDepartmentId` subject to I53; DH **cannot** change `primaryDepartmentId` (I56) |
| POST | `/technicians/:id/deactivate` (or PATCH active=false) | Admin; DH if own-dept tech | Subject to open-job block |

---

## Data behavior

- `Technician`: id, name, phone, email optional, primaryDepartmentId, active, timestamps.
- Open-job check: any Job assigned to technician where status ∉ {Closed, Cancelled} (jobs module / F-005+; until jobs exist, deactivate/primary-change always allowed).
- No StaffUser link; no login credentials.

---

## Authorization

| Action | Admin | DH | Front desk | Coordinator | Tech link |
|--------|-------|----|------------|-------------|-----------|
| View directory | Yes (all) | Yes (own dept) | Yes (all, RO) | No | No |
| Create/edit (non-primary-dept fields) | Yes | Own dept | No | No | No |
| Change primary department | Yes (if no open jobs) | **No (I56)** | No | No | No |
| Deactivate | Yes (if no open jobs) | Own dept (if no open jobs) | No | No | No |

---

## Error states

- Coordinator directory access → rejected.
- FD mutate → rejected.
- DH create/edit outside own department → rejected.
- DH primary-department change → rejected (I56).
- Deactivate / Admin primary-dept change with open jobs → rejected.
- Missing required fields → rejected.

---

## Edge cases

- DH editing a technician who was moved by Admin to another department: after move, DH loses manage rights (no longer own dept).
- Reactivate (active=true) allowed for Admin/DH per same scope rules; no open-job constraint on reactivate.
- Assignment of inactive technicians rejected in AO-F-006 (not this feature’s select API).

---

## Dependencies

- AO-F-001 departments.
- AO-F-002 roles/session.
- Job assignment rows for open-job guards (F-005/F-006).
- Audit write helper.
- **I56** requirements decision before enabling DH primary-dept change.

---

## Constraints

- Do not invent technician login.
- Do not invent phone validation (M45).
- Do not silently grant DH primary-dept change (I56).
- Do not implement select/WhatsApp/link here (AO-F-006).

---

## Out of scope

- Job assignment, shareable links, WhatsApp (AO-F-006)
- Technician mobile app / login
- Resolving I56 (escalate for requirements change)
- Audit viewer (AO-F-012)
- SLA / reports workload snapshots (consume directory later)

---

## Test requirements

- Unit: B4 deactivate block; I53 Admin primary-dept block; DH primary-dept change always rejected; DH scope; FD RO; Coordinator deny.
- Integration: HTTP authz matrix.
- Playwright: Admin creates tech; DH cannot change primary dept; deactivate blocked with open job fixture; FD read-only; Coordinator denied.

---

## Definition of Done

- [x] Spec human-approved (including I56 stance).
- [x] UI contract human-approved (or N/A).
- [ ] PLAN + implementation meet AC and UI contract.
- [ ] Feature-owned tests + applicable E2E green.
- [ ] Build/type/lint clean; review passed.
- [ ] Breakdown row updated; I56 still listed open for later.

---

## Open questions / human decisions

1. **I56** remains deferred — this spec locks **Admin-only** primary-department change. Confirm that stance for MVP build (recommended) or supply a requirements change to allow DH.
2. **UI (decided):** After edit Save → return to list.
3. **UI (decided):** List filter default **Active**.

---

## Human approval

**Stop point.** No production code from this artifact until approved.

- [x] Approve AO-F-004 as written (Admin-only primary-dept change until I56) — **HUMAN APPROVED 2026-08-12**
- [x] Approve UI contract as written — **HUMAN APPROVED 2026-08-13** (Save → list; filter default Active)
- [ ] Approve UI contract with amendments: _______________________
- [ ] Reject / replan UI contract
