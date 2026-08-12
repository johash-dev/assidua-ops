# AO-F-005 — Inquiry & job intake

**Feature ID:** AO-F-005  
**Parent:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN + RC-001 / I58); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED + RC-001 amend); ADR-006, ADR-008  
**Breakdown:** `docs/specs/AO-MVP-001-feature-breakdown.md`  
**Depends on:** AO-F-001 (active leaves + dept defaults), AO-F-002 (roles/session), AO-F-003 (customer + site), AO-F-004 (directory exists for later assignment; not required to create)  
**Status:** HUMAN APPROVED (2026-08-12); **RC-001 amend HUMAN CONFIRMED** (2026-08-13)  
**Module:** `jobs`  
**Deferred notes:** **M43** sibling indicator shape (count vs existence — either OK); **M44** issue storage/UI cap is infra-only, not a business max

---

## Objective

Create inquiries with one or more department-owned jobs in a single atomic submit, assign a customer-facing inquiry number, optionally trigger one customer SMS after commit, enforce leaf/site/issue/priority rules, expose role-scoped inquiry/job reads (including DH sibling indicator), and allow FD/DH/Admin job field edits and DH/Admin reclassify per FR-1 / FR-8 / FR-4.3 / M14 / RC-001 — without assignment, lifecycle Close/Cancel, or notes.

---

## Business context

One customer call → one inquiry → one or more jobs (one leaf each, possibly across departments). Jobs are never appended later; follow-up = new inquiry. Department is derived from leaf only. FD may edit job fields until that job has a technician; DH/Admin may edit while the job is open; Closed/Cancelled field edits require Reopen (F-007). Assignment locks FD edits (F-006 sets technician).

---

## User story

As Front Desk (or Admin/DH within create rules), I create an inquiry for a customer with one or more leaf-category jobs so each owning DH is notified and work is visible on the correct department board — and I can correct unassigned job fields before a technician is selected.

---

## Functional requirements

### Create (FR-1.3–1.9)

- FR-J1: Create **one inquiry** referencing an existing **customer**, with **one or more jobs** in the same request. Zero-job create is rejected (M29).
- FR-J2: Multi-job create is **atomic**: any invalid job rejects the **entire** submission — no inquiry and no jobs persisted (M20).
- FR-J3: Within one inquiry, **at most one job per leaf**; duplicate leaf in the same submission is rejected (M25).
- FR-J4: Each job requires: **active leaf** category (non-leaf rejected), **issue** (required non-empty after trim; whitespace-only rejected; no business min/max — B6/M11/M44), **priority** (Low|Normal|High|Urgent; default **Normal** if omitted — I12), **site** that belongs to the inquiry’s customer. Department is **derived** from the leaf; status = **New**; no technician.
- FR-J5: Front Desk and Admin may create jobs for **any** department leaves. DH may create only with leaves in **their** department (no cross-dept jobs on a DH-created inquiry) (FR-1.3).
- FR-J6: Coordinators **cannot** create inquiries/jobs (Auth table).
- FR-J7: No add-job-to-existing-inquiry API/UI; follow-up work uses a **new** inquiry (FR-1.6).
- FR-J8: No deletion of inquiries or jobs (I25).
- FR-J9: On successful create, for **each** job: notify owning DH via `JOB_CREATED` after commit (FR-1.5; delivery = AO-F-009). Emit `JobTimelineEvent` **Created** (ADR-006). Append audit for inquiry/job create (I17).
- FR-J10: On create, set each job’s initial `deadlineAt` to Asia/Colombo **end of calendar day** of (create date + owning department `defaultSlaDays`) (architecture; FR-5.1 default path). Per-job override / bulk default-update UX = **AO-F-008**.
- FR-J20: On successful create, assign unique `inquiryNumber` `YYYYMMDD-NNN` (Asia/Colombo; daily sequence via `InquiryNumberCounter` in the same transaction — ADR-008). Always assign; show in staff UI (FR-1.7 / RC-001).
- FR-J21: After create commit, emit `CUSTOMER_INQUIRY_CREATED` once per inquiry for F-009 SMS path (FR-1.8–1.9). Do **not** roll back create if SMS fails; surface actor warning when F-009 reports SMS failure.

### Read / visibility (I41/I51)

- FR-J11: Admin, Front Desk, Coordinator: list/get inquiries and jobs across departments (Coordinator read-only).
- FR-J12: DH: see **only own-department jobs**; on a multi-dept inquiry, **hide** foreign job details and show a **non-detailed sibling indicator** (count **or** existence — **M43**, PLAN may pick either). No foreign job fields.

### Edit / reclassify (FR-8, FR-4.3, M14)

- FR-J13: Front Desk may edit a job’s **issue / site / priority / category (leaf)** only while that job has **no technician selected**. After technician select (AO-F-006), FD job-field edits are rejected.
- FR-J14: If an FD (or DH/Admin) edit changes derived department while applicable, notify old and new DH via `JOB_DEPT_CHANGED` **once** if same DH (I8/M32/M38).
- FR-J15: DH (own dept) and Admin (any) may edit issue/site/priority/category on **open** jobs (status ∉ {Closed, Cancelled}). Closed/Cancelled field edits are rejected until Reopen (M14 / F-007).
- FR-J16: DH/Admin **reclassify** = change leaf; department re-derived; technician and status **kept**; dual-DH notify once if same DH (FR-4.3 / I31). Reclassify on Closed/Cancelled rejected until Reopen.
- FR-J17: Site on edit must still belong to the inquiry’s customer; leaf must be active; issue trim rules same as create; priority enum enforced.
- FR-J18: Job field edits and reclassify append audit events (I17). Customer edit remains AO-F-003 (FR-8.2).
- FR-J19: Priority is display/sort only — **no** automatic SLA or notification changes from priority (baseline Confirmed).

---

## Non-functional requirements

- NFR-4: NestJS enforces role/department checks; UI not trusted.
- NFR-3: Deadline calendar math uses **Asia/Colombo**.
- NFR-6: Concurrent edits last-write-wins.
- Atomic create uses a single DB transaction.
- Repository-only DB; rules in `jobs` service; notify via notifications service after commit (no rollback of create if notify fails — actor warning pattern when F-009 lands; until then best-effort emit is enough for this slice’s contract).

---

## Acceptance criteria

### Atomic create

- Given FD/Admin, when they create an inquiry with customer + ≥1 valid jobs (active leaves, non-empty issue, site on that customer, priority defaulting to Normal when omitted), then one inquiry and all jobs persist with status New, derived departments, and each job’s deadline from that department’s `defaultSlaDays`.
- Given whitespace-only or empty issue on any job in a multi-job submit, when submitting, then **nothing** is created.
- Given two jobs with the same leaf in one submission, when submitting, then create is rejected.
- Given zero jobs, when submitting, then create is rejected.
- Given a non-leaf category id, when submitting, then create is rejected.
- Given an inactive leaf, when submitting, then create is rejected.
- Given a site that does not belong to the selected customer, when submitting, then create is rejected.
- Given Rivon DH, when creating with Assidua→A/C leaf, then create is rejected; when creating Rivon→Car, then create succeeds.
- Given FD creates Rivon→Car and Assidua→A/C in one inquiry, when created, then both jobs exist under one inquiry/customer and each owning DH receives `JOB_CREATED` (notification delivery may be stubbed until F-009); **exactly one** `CUSTOMER_INQUIRY_CREATED` emit for SMS path; inquiry has `inquiryNumber`.
- Given a successful create, when staff view the inquiry, then `inquiryNumber` is visible (`YYYYMMDD-NNN`).
- Given two creates on the same Asia/Colombo day, when inspecting numbers, then distinct ascending `NNN` under the same date prefix.
- Given Coordinator, when attempting create, then rejected.
- Given any role, when attempting to delete an inquiry or job, then rejected.
- Given an existing inquiry, when client attempts to append a job, then no such operation succeeds (no endpoint / rejected).

### Read / DH sibling

- Given an inquiry with Rivon and Assidua jobs, when Rivon DH opens it, then only Rivon job details are returned and a non-detailed sibling indicator shows other-department jobs exist (or count — M43).
- Given FD/Admin/Coordinator on the same inquiry, when opening it, then all jobs are visible (Coordinator cannot mutate).

### FD / DH / Admin edit

- Given a New job with no technician, when FD edits issue/site/priority/leaf, then the change is allowed; if derived department changes, old and new DH are notified once if same person.
- Given a New Assidua→A/C job, when FD changes leaf to Assidua→UPS (same dept), then Assidua DH is notified once (not twice).
- Given a job with a technician selected, when FD attempts issue/site/priority/category edit, then rejected.
- Given an open job (with or without technician), when DH (own dept) or Admin edits issue/site/priority/category, then allowed subject to leaf/site/issue rules.
- Given Closed or Cancelled, when DH/Admin edits issue/site/priority/category or reclassifies, then rejected until Reopen (fixture via F-007 or test seed).
- Given Assidua job with technician, when Admin/DH reclassifies leaf to Rivon→Car, then department becomes Rivon, technician and status remain, both DHs notified (once if same).

### Audit / timeline

- Given successful inquiry create, when audit/timeline are queried, then inquiry/job create audit and Created timeline events exist.
- Given reclassify or job field edit that is allowed, when audit is queried, then corresponding events exist.

---

## User-visible behavior

- FD/Admin: inquiry create (multi-job), full inquiry/job browse, FD edits until tech select; Admin edits/reclassify while open.
- DH: create own-dept only; browse own-dept jobs + sibling indicator; edit/reclassify own-dept open jobs.
- Coordinator: read-only all inquiries/jobs; no create/edit/reclassify.
- No assignment, Close/Cancel/Reopen, notes, or SLA override controls in this feature’s UI.

---

## API behavior

| Method | Resource | Authz | Behavior |
|--------|----------|-------|----------|
| POST | `/inquiries` | FD, Admin (any leaves); DH (own-dept leaves only) | Atomic multi-job create; body: `customerId`, `jobs[]` (`categoryLeafId`, `issue`, `siteId`, `priority?`) |
| GET | `/inquiries` | Authenticated staff | List; DH filtered to inquiries with ≥1 own-dept job (PLAN may refine filters) |
| GET | `/inquiries/:id` | Authenticated staff | Detail; DH: own-dept jobs only + sibling indicator (M43) |
| GET | `/jobs/:id` | Authenticated staff | Detail; DH only if job.department = DH dept |
| PATCH | `/jobs/:id` | FD if no technician; DH own-dept if open; Admin if open | Edit issue/site/priority/categoryLeafId; Closed/Cancelled rejected |
| POST | `/jobs/:id/reclassify` (or PATCH leaf via dedicated action) | DH own-dept if open; Admin if open | Reclassify leaf; dual-DH notify; keep tech/status |

No `POST /inquiries/:id/jobs`. No DELETE inquiry/job.

---

## Data behavior

- `Inquiry`: id, inquiryNumber (unique), customerId, createdAt, createdByStaffUserId; never deleted.
- `InquiryNumberCounter`: colomboDate, lastSeq — allocate inside create transaction (ADR-008).
- `Job`: id, inquiryId, categoryLeafId, derived departmentId, siteId, issue, priority, status=`New` on create, technicianId null until F-006, deadlineAt, perJobOverride flag/date optional (owned/fully wired in F-008), cancelReason null until F-007, timestamps; never deleted.
- Site FK must reference a `CustomerSite` of the inquiry customer.
- Open = status ∉ {Closed, Cancelled} for edit/reclassify guards.
- “Technician selected” = `technicianId` present (set by AO-F-006).

---

## Authorization

| Action | Admin | DH | Front desk | Coordinator | Tech link |
|--------|-------|----|------------|-------------|-----------|
| Create inquiry/jobs | Yes (any dept) | Own-dept leaves only | Yes (any) | No | No |
| View inquiries/jobs | Yes (all) | Own-dept jobs + sibling indicator | Yes (all) | Yes (all, RO) | No (F-006/F-007) |
| Edit job fields | Yes if open | Own dept if open | Yes only if no technician | No | No |
| Reclassify | Yes if open | Own dept if open | No | No | No |
| Delete inquiry/job | No | No | No | No | No |
| Assign / lifecycle / notes | No (later features) | — | — | — | — |

---

## Error states

- Coordinator create/edit/reclassify → rejected.
- DH create/edit/reclassify outside own department → rejected.
- Zero jobs / duplicate leaf / non-leaf / inactive leaf / bad site / empty issue → create rejected (atomic).
- FD edit after technician selected → rejected.
- Edit/reclassify on Closed/Cancelled → rejected.
- Delete inquiry/job → rejected.
- Append job to existing inquiry → not supported / rejected.

---

## Edge cases

- Multi-job inquiry: tech select on one job locks FD edits **for that job only**; sibling jobs without technicians remain FD-editable; customer remains editable (F-003).
- DH-created inquiry cannot mix departments even if FD could.
- Priority Urgent does not change deadline or notifications.
- Same-DH old/new department → single `JOB_DEPT_CHANGED` notification.
- Issue length: no business max; PLAN may apply defensive DB/UI limit labeled non-business (M44).
- Until F-006 exists, all jobs lack technicians → FD edits always allowed on New jobs created here.
- Until F-007 exists, Closed/Cancelled fixtures for M14 tests may be seeded directly in tests.

---

## Dependencies

- AO-F-001 active leaves + `defaultSlaDays`.
- AO-F-002 session/roles + DH department binding.
- AO-F-003 customer + sites.
- AO-F-004 not required for create; assignment pool later.
- Notifications orchestrator / F-009 for real channel delivery of `JOB_CREATED` / `JOB_DEPT_CHANGED` / `CUSTOMER_INQUIRY_CREATED` (SMS).
- AO-F-006 sets `technicianId` (FD edit gate).
- AO-F-007 Reopen unlocks Closed/Cancelled edits; owns Close/Cancel.
- AO-F-008 per-job SLA override and default bulk update.
- Audit write helper; JobTimelineEvent writer (ADR-006).
- ADR-008 inquiry number + SMS boundary.

---

## Constraints

- Do not invent add-to-existing-inquiry.
- Do not invent billing, customer portal, or technician login.
- Do not invent sibling-indicator product preference beyond M43 (either OK).
- Do not invent issue max length as business rule (M44).
- Do not implement assignment, WhatsApp, lifecycle Close/Cancel/Reopen, notes, or SLA override UI here.
- Do not free-pick department independent of leaf.

---

## Out of scope

- Technician select / shareable links / WhatsApp (AO-F-006)
- Status machine beyond create→New; Close/Cancel/Reopen; cancel reason (AO-F-007)
- Notes (AO-F-007)
- Per-job deadline override UX / at-risk scheduler (AO-F-008 / F-010)
- Notification settings UI and channel adapters productization (AO-F-009) — emit events only
- Audit/report viewers (AO-F-012 / F-011)
- Customer/site CRUD (AO-F-003)

---

## Test requirements

- Unit: atomic rollback; duplicate leaf; zero jobs; DH leaf scope; issue trim; site ownership; FD edit gate; open-only DH/Admin edit; reclassify keeps tech/status; sibling indicator DTO; deadline from `defaultSlaDays`.
- Integration: HTTP authz matrix for create/read/patch/reclassify; Coordinator deny mutate.
- Playwright: FD multi-dept create; Rivon DH sees own jobs + sibling indicator; FD edit then blocked after tech fixture; DH cannot create Assidua leaf; Coordinator read-only.

---

## Definition of Done

- [ ] Spec human-approved (including M43 PLAN latitude).
- [ ] PLAN + implementation meet AC.
- [ ] Feature-owned tests + applicable E2E green.
- [ ] Build/type/lint clean; review passed.
- [ ] Breakdown row updated.

---

## Open questions / human decisions

1. **M43** — sibling indicator: count vs existence string. Architecture allows either; confirm OK to leave to PLAN/UI.
2. Initial deadline on create via department `defaultSlaDays` (this spec) vs deferring all deadline writes until AO-F-008 — **recommended: set on create here** so boards/F-006 have a deadline; F-008 owns overrides.

No other blockers from frozen baseline.

---

## Human approval

**Approved (2026-08-12)** as written (deadline on create; M43 left to PLAN).  
**RC-001 amend (2026-08-13)** — inquiry number + `CUSTOMER_INQUIRY_CREATED` emit — **HUMAN CONFIRMED**. PLAN may include this path.
