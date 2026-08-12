# AO-F-012 — Audit log views

**Feature ID:** AO-F-012  
**Parent:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED); ADR-006  
**Breakdown:** `docs/specs/AO-MVP-001-feature-breakdown.md`  
**Depends on:** Append-only `AuditEntry` writes from AO-F-002–008 (and peers); AO-F-002 roles for Admin/DH authz  
**Status:** HUMAN APPROVED (2026-08-12)  
**Module:** `audit` (read/view + shared write helper contract)  
**Deferred gate:** **I55** — whether cancel-reason *edits* (M41) are captured in MVP audit  
**Also noted:** **M18** — audit retention period deferred (no TTL job)

---

## Objective

Let Admin view the full append-only audit log and DH view their department’s job-scoped audit entries for the I17-required event set — without inventing retention TTL, settings/taxonomy/notes audit requirements, or cancel-reason-edit audit ACs until I55 is decided.

---

## Business context

Audit is the human-readable compliance view of data changes (separate from `JobTimelineEvent` used for metrics — ADR-006). Writers in owning features already append required events. This feature owns the **viewer** (and the shared write helper shape if not already centralized), Admin full access, and DH department-job scope. Notes, notification settings, and taxonomy changes are intentionally out of MVP audit (I45). Retention period is out of scope (M18).

---

## User story

As Admin (or DH for my department’s jobs), I open an audit report so I can see who changed what and when for the required event types.

---

## Functional requirements

### Write contract (shared; writers remain in owning features)

- FR-V1: Persist append-only `AuditEntry` with at least: actor (staff user id), timestamp, action/event type, entity refs, optional payload/summary, **departmentId** when applicable for DH scoping (architecture).
- FR-V2: **Must include (I17):** status changes; technician select/reassign; Cancel/Reopen (with reasons on Cancel/Reopen actions); reclassify; SLA deadline overrides (including department-default bulk update when chosen); create inquiry/job; customer create/edit; site create/edit/delete **attempts**; technician directory changes; staff user/role changes.
- FR-V3: **Must not require (I45):** notification channel setting changes; taxonomy (department/leaf) changes; note add/edit.
- FR-V4: Site delete **attempts** (success and business-rule rejection) remain auditable per AO-F-003 / I17 intent.
- FR-V5: **I55 GATE — cancel-reason edits:** Cancel **action** (with reason) is I17-required. Whether **subsequent cancel-reason edits** (M41) are audited is undecided. For MVP build: **do not emit** cancel-reason-edit audit rows and **do not** assert their presence or absence in viewer ACs until I55 is decided via requirements change (architecture: block audit AC for M41 edit events; do not silently productize either choice).

### Viewer (FR-6.2, NFR-2)

- FR-V6: **Admin** may list/filter/view **all** audit entries.
- FR-V7: **DH** may list/filter/view only entries scoped to **their department’s jobs** (baseline: department-job audit). Practically: entries with `departmentId` = DH’s department (job lifecycle/assignment/SLA/reclassify/inquiry-job creates for that dept, own-dept technician directory events, etc.). Entries that are not department-scoped (e.g. global staff user admin, unscoped customer rows) are **Admin-only** unless a writer attached a departmentId — **do not invent** DH visibility for unscoped customer/staff events.
- FR-V8: Front Desk, Coordinator, and technicians **cannot** access audit (Auth table / M5). Tech link must not expose audit (I27).
- FR-V9: Viewer is read-only — **no** edit/delete/amend of audit rows.
- FR-V10: **No retention TTL / purge job** in MVP (M18). Entries remain until a later compliance decision.

### Filters / UX (minimal; no invention)

- FR-V11: Support at least: chronological list (newest first default), pagination or bounded page size (PLAN), and basic filters PLAN may choose among time range / action type / entity id — **must not** invent export/SIEM product beyond “viewable as a report” (NFR-2).
- FR-V12: Display enough for a human to understand actor, when, action, and entity; Cancel/Reopen show reasons when stored on those action events.

---

## Non-functional requirements

- NFR-2: I17 capture + viewable report; retention deferred (M18).
- NFR-4: NestJS enforces Admin vs DH scope; UI not trusted.
- Append-only: no UPDATE/DELETE APIs for `AuditEntry`.
- Distinct from reports metrics engine (F-011) and timeline (ADR-006).

---

## Acceptance criteria

### Access

- Given Admin, when opening audit, then entries across departments/event types (I17 set) are visible.
- Given DH, when opening audit, then only their department-scoped job-related entries are visible; other departments’ job audit is hidden.
- Given FD or Coordinator, when accessing audit APIs/UI, then rejected.
- Given technician token, when requesting audit, then rejected / not exposed on allow-list.

### I17 presence (writers + viewer)

- Given Admin views audit after fixtures for: status change, technician select/reassign, Cancel with reason, Reopen, reclassify, SLA override (and bulk-true default update), inquiry/job create, customer create/edit, site create/edit/delete attempt, technician directory change, staff user/role change — when viewing, then those event types are present.
- Given notification setting change, taxonomy change, or note add, when viewing audit, then those are **not required** to appear (I45).

### I55

- Given Cancelled job whose cancel reason is later edited (M41), when audit ACs run, then **no** requirement that a cancel-reason-edit event exists (I55 gate). Cancel **action** event with reason remains required.
- Given MVP writers, when cancel reason is edited, then **no** cancel-reason-edit audit row is emitted until I55 decides otherwise.

### Immutability / retention

- Given any role, when attempting to modify or delete an audit row via API, then rejected.
- Given MVP deploy, when checking scheduled jobs, then no audit TTL purge job is required (M18).

---

## User-visible behavior

- Admin: full audit report/list UI.
- DH: department-scoped audit report/list UI.
- FD/Coordinator/Tech: no audit navigation/API.

---

## API behavior

| Method | Resource | Authz | Behavior |
|--------|----------|-------|----------|
| GET | `/audit` | Admin (all); DH (own `departmentId` filter enforced server-side) | List/filter paginated entries |
| GET | `/audit/:id` | Same scope | Detail |
| (internal) | `AuditService.append(...)` | Owning feature services | Append-only write helper |

No PATCH/DELETE on audit entries.

---

## Data behavior

- `AuditEntry`: id, createdAt, actorStaffUserId, action, entityType, entityId, departmentId?, payload/summary (JSON or text), immutable.
- Writers in F-002–008 call append helper inside/after successful business transactions as each feature already specifies.
- Not a source for F-011 metrics.

---

## Authorization

| Action | Admin | DH | Front desk | Coordinator | Tech link |
|--------|-------|----|------------|-------------|-----------|
| View audit | Yes (all) | Own dept-scoped only | No | No | No |
| Append audit | Via services | Via services | Via services where allowed | No mutate paths | No |
| Edit/delete audit rows | No | No | No | No | No |

---

## Error states

- FD/Coordinator/unauthenticated audit access → rejected.
- DH request without scope enforcement → must not leak other depts (server filter mandatory).
- Mutate/delete audit → rejected.

---

## Edge cases

- Customer/site audits without departmentId: Admin-visible; not shown to DH (baseline job-dept scope).
- Staff user/role audits: Admin-visible.
- Duplicate rapid events: all append; no merge.
- Empty audit for new DH dept: empty list OK.

---

## Dependencies

- Writers from approved features F-002–008 (and F-001 explicitly non-audited).
- AO-F-002 session/roles.
- **I55** requirements decision before requiring or forbidding cancel-reason-edit rows as product AC.
- M18 later for retention.

---

## Constraints

- Do not invent cancel-reason-edit audit requirement (I55).
- Do not invent notes/settings/taxonomy audit requirement (I45).
- Do not invent retention TTL (M18).
- Do not use audit text as reports metric source (ADR-006).
- Do not allow FD/Coordinator/tech audit access.
- Do not allow audit row mutation.

---

## Out of scope

- Resolving I55 / M18 (escalate for requirements/compliance change)
- SIEM export, legal hold, or multi-year retention product
- Performance report metrics (AO-F-011)
- Notification settings UI (AO-F-009)

---

## Test requirements

- Unit: DH department filter; Admin unfiltered; append immutability; I17 action catalog coverage via fixtures; I45 exclusions; I55 no edit-event AC.
- Integration: HTTP authz matrix; DH cannot read other dept job audit.
- Playwright: Admin sees Cancel + customer edit + role change; DH sees own-dept only; Coordinator denied; cancel-reason edit does not create required audit assertion.

---

## Definition of Done

- [ ] Spec human-approved (including I55 stance).
- [ ] PLAN + implementation meet AC; writers aligned (no cancel-reason-edit emit).
- [ ] Feature-owned tests + applicable E2E green.
- [ ] Build/type/lint clean; review passed.
- [ ] Breakdown row updated; I55 still listed open; checklist deferred-gate item may be marked accepted for placement.

---

## Open questions / human decisions

1. **I55** remains deferred — this spec locks **no emit + no viewer AC** for cancel-reason *edits* until a requirements change. Confirm that stance for MVP build (recommended).

No other blockers. M18 stays deferred (no TTL).

---

## Human approval

**Approved (2026-08-12)** as written (I17 viewer; I55 = no edit-audit emit/AC; no retention TTL). PLAN may proceed for AO-F-012. No production code in this artifact.
