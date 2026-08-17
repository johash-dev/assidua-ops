# AO-F-001 — Department & category taxonomy

**Feature ID:** AO-F-001  
**Parent:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED); ADR-001  
**Breakdown:** `docs/specs/AO-MVP-001-feature-breakdown.md`  
**Status:** HUMAN APPROVED (2026-08-12); **UI contract:** HUMAN APPROVED (2026-08-13)  
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

## UI contract

**UI in scope:** yes  
**Drafted:** 2026-08-13 (UI/UX Agent)  
**Status:** HUMAN APPROVED (2026-08-13) — tree + dialogs; Save stays on `/taxonomy`; inactive always visible; add-category on department/group only; leaf department change on edit

### Screens / routes

| Route | Purpose |
|-------|---------|
| `/taxonomy` | Admin tree: departments with nested groups and leaves; create/edit/deactivate/reactivate in-place |

No separate create/edit routes. No non-Admin taxonomy page. Intake leaf pickers are not this feature.

### Primary flows

1. **View (Admin):** Open `/taxonomy` → seeded tree visible: Rivon → Car; Rover → Bike; Assidua → A/C, UPS, Smart Board, Home Appliances → Tv, Washing Machine, Fridge. Leaves and groups are distinguishable. Inactive nodes stay on the tree, labeled Inactive.
2. **Create department:** **Add department** → name + Default SLA days (integer ≥ 1; field default **10**) → Save → stay on `/taxonomy` with the new department (active).
3. **Create category:** From a department or a **group** → **Add category** → name, type **Leaf** or **Group**, parent pre-filled (department root or that group; changeable to another group/root **in the same department**) → Save → stay on tree. Not offered on a leaf.
4. **Edit department:** **Edit** → name and/or Default SLA days → Save → stay on tree. **No** “update open jobs without override?” prompt (AO-F-008).
5. **Edit category:** **Edit** → name; parent within the same department (root or group, never a leaf). If the node is a **leaf**, department may be changed (parent then must be root or a group in the **new** department). Save → stay on tree. If any job references the leaf, department change is rejected in-page; name/parent-within-dept still allowed.
6. **Deactivate:** From the tree row → **Deactivate** → confirm → on success, node shows Inactive; on job-reference block (leaf or department), show server error and leave it active. No reclassify wizard.
7. **Reactivate:** On an inactive department or node → **Reactivate** (no job-reference gate) → active again.
8. **Non-Admin (DH / FD / Coordinator):** No nav entry. Direct `/taxonomy` → access denied (same forbidden-page pattern as other staff pages).
9. **Tech link:** No taxonomy UI.

`isLeaf` / type is set at create only — no Leaf ↔ Group conversion control.

### Role matrix

| Chrome / action | Admin | DH | FD | Coordinator | Tech link |
|-----------------|-------|----|----|-------------|-----------|
| Nav: Taxonomy | Yes | **No** | **No** | **No** | **No** |
| Open `/taxonomy` | Tree | Access denied | Access denied | Access denied | — |
| See inactive nodes | Yes | — | — | — | — |
| Add department / category | Yes | **Hidden** | **Hidden** | **Hidden** | — |
| Edit name / SLA days / parent | Yes | **Hidden** | **Hidden** | **Hidden** | — |
| Change leaf department | Yes (server may reject if referenced) | **Hidden** | **Hidden** | **Hidden** | — |
| Deactivate / Reactivate | Yes | **Hidden** | **Hidden** | **Hidden** | — |

Server authz remains the boundary; hidden controls are UX only. Non-Admin **GET /taxonomy** for intake options is API-only; those pickers land in AO-F-005 / later surfaces.

### States

| Screen | Empty | Loading | Validation | Error | Success |
|--------|-------|---------|------------|-------|---------|
| Tree | “No departments” + Add department (seeded env is not empty) | Tree skeleton/spinner | — | Load failure message | — |
| Create/Edit dialog | — | Submit pending | Inline: name required (trim); Default SLA days integer ≥ 1; category type required on create | Server rejects (SLA days below 1, invalid/cross-dept parent, leaf department-move while referenced, deactivate while referenced, non-Admin) as in-dialog or in-page alert | Close dialog; tree refreshed; stay on `/taxonomy` |
| Deactivate confirm | — | Submit pending | — | Job-reference block from API; node stays active | Close dialog; tree refreshed |
| Forbidden | — | — | — | Standard access-denied page for DH/FD/Coordinator (and unauthenticated once F-002 exists) | — |

### Copy constraints

- Labels from fields/spec only: Name, Default SLA days, Leaf, Group, Parent, Active, Inactive.
- Type help (optional, one line): Leaf is selectable at intake; Group is not.
- Deactivate confirm: department or node will no longer be offered for intake; do not invent “reclassify jobs first” as a product flow. Job-reference block: surface the API/meaningful error.
- No bulk-SLA / deadline copy on this screen (AO-F-008).
- No marketing headlines; no audit history on this page (I45).

### Reuse

- Staff shell/nav from AO-F-002 when it exists (this slice does not build login).
- Look & feel: **ADR-009** (Tailwind + shadcn/`components/ui` + shared tokens). Existing `Button`; add `Input` / `Select` / `Alert` / `ConfirmDialog` / `PageHeader` / `EmptyState` when this screen needs them — no per-feature visual system.
- Tree is a nested list, not a new tree-kit.
- **Density (amended after first implement):** departments are section headers; row actions are quiet ghost controls; label **Group** and **Inactive** only — do not stamp Active/Leaf on every row.
- Access-denied page: same as other forbidden staff routes (F-002 / later shell).

### Out of UI scope

- Staff login/session and user admin (AO-F-002)
- Intake / reclassify / FD category pickers (AO-F-005 / F-007)
- SLA bulk “update open jobs without override?” prompt and deadline recalc (AO-F-008)
- Audit log viewer (AO-F-012)
- Hard-delete
- Search, sort, collapse-as-product, or Active/Inactive filter (tree is small; Admin must see inactive to reactivate)
- Changing Leaf ↔ Group after create
- Add category under a leaf
- Read-only taxonomy page for non-Admin
- Dual-DH notify on leaf department move (no jobs owned here)

### Open questions / human decisions (UI)

1. ~~One tree page + dialogs vs list/new/id routes?~~ → **tree + dialogs** (HUMAN DECIDED).
2. ~~After Save: stay vs leave?~~ → **stay on `/taxonomy`** (HUMAN DECIDED).
3. ~~Inactive filter?~~ → **always visible; no filter** (HUMAN DECIDED).
4. ~~Add category on leaves?~~ → **department or group only** (HUMAN DECIDED).
5. ~~Leaf department change UX?~~ → **on edit dialog; server reject if referenced** (HUMAN DECIDED).

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

- [x] This spec human-approved.
- [x] UI contract human-approved.
- [x] Implementation plan approved (PLAN).
- [ ] Seed + Admin CRUD + deactivate guards meet acceptance criteria above.
- [ ] Feature-owned tests green; applicable E2E green when UI+auth available.
- [ ] Build/type/lint clean for touched packages.
- [x] Independent review passed.
- [ ] Breakdown status for AO-F-001 updated to Approved/Complete.
- [ ] No silent resolution of deferred requirements IDs.

---

## Open questions / human decisions

Resolved by human approval as written (2026-08-12):

1. **Leaf department move while referenced:** Reject (locked).
2. **Non-Admin taxonomy GET:** Authenticated staff (including Coordinators) may read active leaves (locked).
3. **E2E sequencing:** Taxonomy API + seed may proceed in PLAN under Admin auth from AO-F-002 (or test harness until F-002); full Admin UI Playwright waits on F-002 session. Not a requirements gap.

**UI (decided 2026-08-13):** tree + dialogs; Save stays on `/taxonomy`; inactive always visible; add-category on department/group only; leaf department change on edit (server reject if referenced).

---

## Human approval

**Spec approved (2026-08-12)** as written.

**Stop point — UI contract.** No PLAN / production UI until this contract is approved.

- [x] Approve AO-F-001 UI contract as written — **HUMAN APPROVED 2026-08-13**
- [ ] Approve with amendments: _______________________
- [ ] Reject / replan UI contract
