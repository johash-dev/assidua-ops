# AO-F-001 — Department & category taxonomy

**Feature ID:** AO-F-001  
**Parent:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED); ADR-001  
**Breakdown:** `docs/specs/AO-MVP-001-feature-breakdown.md`  
**Status:** HUMAN APPROVED (2026-08-12)  
**Module:** `taxonomy`

---

## Objective

Give Admins a managed department and category tree so intake can select **leaf** categories only and derive department from the leaf — including deactivate guards while any job references the leaf/department.

---

## Business context

Assidua Ops routes jobs by leaf category into Rivon, Rover, or Assidua. Taxonomy is admin-managed. Leaves with historical jobs are effectively permanent unless jobs are reclassified first (M17 / B5).

---

## User story

As an Admin, I manage departments and category leaves (including nested non-leaf groups) so Front Desk / DH / Admin can pick only valid leaves at intake and the system always derives the owning department.

---

## Functional requirements

- FR-T1: Persist departments and a category tree whose selectable intake nodes are **leaves** only. Department is derived from the leaf’s department (baseline Departments and categories; Decision 1/206).
- FR-T2: Seed (and keep editable) the confirmed tree:
  - **Rivon** → Car (leaf)
  - **Rover** → Bike (leaf)
  - **Assidua** → A/C, UPS, Smart Board (leaves); Home Appliances → Tv, Washing Machine, Fridge (leaves)
- FR-T3: Admin may add, edit, and deactivate departments and category nodes (FR-7.1).
- FR-T4: Deactivating a department or leaf is **rejected** while **any** job (any status, including Closed/Cancelled) references that leaf or department (B5 / M17).
- FR-T5: Active leaves are the only categories offered for job create / reclassify / FD category edit (non-leaf selection rejected — baseline error states).
- FR-T6: Each department stores `defaultSlaDays` (integer ≥ 1; architecture default **10**). Admin may set this value when creating/editing a department in this feature. **Bulk “update open jobs without override?” prompt and deadline recalculation belong to AO-F-008**, not this feature.
- FR-T7: Taxonomy changes are **not** required in MVP audit (I45 / I17 exclusions).

---

## Non-functional requirements

- NFR-4: Authorization enforced in NestJS (UI not trusted).
- NFR-3: No Colombo calendar logic required in this feature beyond storing integer day counts for defaults.
- Persistence via Prisma/PostgreSQL; repository-only DB access; business rules in `taxonomy` service.

---

## Acceptance criteria

### Seed / read

- Given a fresh environment after seed, when Admin (or authenticated staff allowed to read taxonomy for intake) lists taxonomy, then Rivon/Car, Rover/Bike, and Assidua leaves (A/C, UPS, Smart Board, Tv, Washing Machine, Fridge under Home Appliances) exist as active, and each leaf’s derived department matches the tree above.
- Given a non-leaf node (e.g. Home Appliances), when any client attempts to use it as a job category, then the request is rejected.

### Admin mutate

- Given an Admin, when they create a department with name and `defaultSlaDays` ≥ 1, then it is persisted active and available for new leaves.
- Given an Admin, when they create/edit a leaf under a department (or under a non-leaf parent in that department), then the leaf is selectable for intake and derives that department.
- Given an Admin, when they set `defaultSlaDays` < 1, then the change is rejected.
- Given DH, Front Desk, or Coordinator, when they attempt taxonomy create/edit/deactivate, then the change is rejected.

### Deactivate guards

- Given any job (including Closed/Cancelled) references leaf Tv, when Admin attempts to deactivate Tv (or Assidua), then deactivate is rejected.
- Given no jobs reference a leaf, when Admin deactivates that leaf, then deactivate succeeds and new intake cannot use it.
- Given no jobs reference any leaf in a department and rules above are satisfied, when Admin deactivates that department, then deactivate succeeds and its leaves are not offered for intake.

### Read for other roles (intake prep)

- Given Front Desk / DH / Coordinator / Admin authenticated sessions, when loading category options for surfaces that need them, then only **active leaves** are returned (DH create surfaces may further filter to own department in AO-F-005 — this feature exposes data; job create enforcement is F-005).

---

## User-visible behavior

- Admin UI: manage departments and category tree (add/edit/deactivate); set department default SLA days (≥ 1).
- Non-Admin staff: no taxonomy management UI; may consume active-leaf lists where product surfaces need them (intake/reclassify land in later features).
- Deactivated leaves/departments do not appear as selectable intake options.

---

## API behavior

Internal NestJS HTTP API (staff session auth). Exact paths may follow project routing conventions; contracts:

| Method | Resource | Authz | Behavior |
|--------|----------|-------|----------|
| GET | `/taxonomy` (tree) | Any authenticated staff | Active+inactive visibility: Admin sees all; non-Admin receives **active leaves** (and parents as needed for display) only — inactive hidden |
| POST | `/departments` | Admin | Create department (`name`, `defaultSlaDays` ≥ 1) |
| PATCH | `/departments/:id` | Admin | Edit name / `defaultSlaDays` / activate; deactivate subject to FR-T4 |
| POST | `/categories` | Admin | Create node (`name`, `departmentId`, optional `parentId`, `isLeaf`) |
| PATCH | `/categories/:id` | Admin | Edit name/parent (same department), activate; deactivate subject to FR-T4 |

Validation errors return structured 4xx with stable error codes (implementation may choose code strings; must be test-assertable).

---

## Data behavior

- `Department`: id, name, active, `defaultSlaDays` (≥ 1, default 10 on seed).
- `CategoryNode` (name flexible): id, name, departmentId, parentId nullable, isLeaf, active.
- Confirmed seed tree as in FR-T2.
- No hard-delete of departments/categories in MVP — deactivate only.
- Job reference checks for deactivate: any Job row pointing at category/department (jobs module may not exist yet — implement guard against `Job` table when present; until jobs exist, deactivate always allowed). **ponytail:** guard is a repository existence check; no soft invent of job APIs here.

---

## Authorization

| Action | Admin | DH | Front desk | Coordinator | Tech link |
|--------|-------|----|------------|-------------|-----------|
| Manage taxonomy (create/edit/deactivate) | Yes | No | No | No | No |
| Read active leaves for app use | Yes | Yes | Yes | Yes | No |

Server-side only (NFR-4). Depends on AO-F-002 for real staff sessions; until Identity ships, PLAN may use a test harness/admin bootstrap — **DoD for production behavior requires F-002**.

---

## Error states

- Non-Admin taxonomy mutation → rejected.
- `defaultSlaDays` < 1 → rejected.
- Deactivate leaf/department while any referencing job exists → rejected.
- Create leaf without department / invalid parent (cross-department parent) → rejected.
- Mark or use non-leaf as job category → rejected (enforced here on taxonomy read model + later on job write in F-005).

---

## Edge cases

- Nested non-leaves (Home Appliances) are valid structure; only leaves selectable.
- Reclassify of jobs to free a leaf for deactivate is **out of scope** here (job edit/reclassify = F-005/F-007); this feature only enforces the block.
- Renaming a leaf does not change department derivation (departmentId on the node remains source of truth).
- Moving a leaf to another department is an Admin edit of `departmentId` / parent; **no** job dual-DH notify in this feature (no jobs owned here). If jobs already reference the leaf, changing departmentId is a **high-risk** mutation — **reject department change on a leaf while any job references it** (same spirit as B5; avoids silent department drift). Name edits remain allowed.

---

## Dependencies

- AO-ENG-000 platform foundation.
- AO-F-002 for production staff authentication/authorization (Admin role).
- Later: Job rows for deactivate reference checks (F-005+).
- SLA bulk update UX: AO-F-008.

---

## Constraints

- Do not invent additional departments/leaves beyond seed + Admin-created ones.
- Do not require audit entries for taxonomy changes (I45).
- Do not implement intake, DH filtering, or SLA bulk prompts here.
- Technicians have no taxonomy access.

---

## Out of scope

- Staff login/session and role assignment (AO-F-002)
- Job create/reclassify UI and dual-DH notifications (AO-F-005 / F-007)
- SLA deadline recalculation / bulk prompt (AO-F-008)
- Audit log UI (AO-F-012); taxonomy audit not required
- Hard-delete of taxonomy nodes
- Public/partner API

---

## Test requirements

- Service/unit: seed shape; leaf vs non-leaf; `defaultSlaDays` ≥ 1; deactivate blocked when referencing job exists (use fixture job row); Admin-only mutations.
- Integration: HTTP authz matrix for Admin vs FD/DH/Coordinator.
- Playwright: when Admin UI exists — Admin creates leaf, deactivates unreferenced leaf, sees deactivate rejected when referenced; non-Admin cannot open manage taxonomy. (May land with F-002 session.)

---

## Definition of Done

- [ ] This spec human-approved.
- [ ] Implementation plan approved (PLAN).
- [ ] Seed + Admin CRUD + deactivate guards meet acceptance criteria above.
- [ ] Feature-owned tests green; applicable E2E green when UI+auth available.
- [ ] Build/type/lint clean for touched packages.
- [ ] Independent review passed.
- [ ] Breakdown status for AO-F-001 updated to Approved/Complete.
- [ ] No silent resolution of deferred requirements IDs.

---

## Open questions / human decisions

Resolved by human approval as written (2026-08-12):

1. **Leaf department move while referenced:** Reject (locked).
2. **Non-Admin taxonomy GET:** Authenticated staff (including Coordinators) may read active leaves (locked).
3. **E2E sequencing:** Taxonomy API + seed may proceed in PLAN under Admin auth from AO-F-002 (or test harness until F-002); full Admin UI Playwright waits on F-002 session. Not a requirements gap.

---

## Human approval

**Approved (2026-08-12)** as written. PLAN may proceed for AO-F-001 (after or alongside AO-ENG-000). No production code in this artifact.
