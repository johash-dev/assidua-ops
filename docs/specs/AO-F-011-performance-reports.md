# AO-F-011 — Performance reports

**Feature ID:** AO-F-011  
**Parent:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED); ADR-006  
**Breakdown:** `docs/specs/AO-MVP-001-feature-breakdown.md`  
**Depends on:** AO-F-002 (Admin/DH scope); Job + `JobTimelineEvent` writers from AO-F-005–007; AO-F-009 email path; AO-F-010 weekly trigger  
**Status:** HUMAN APPROVED (2026-08-12)  
**Module:** `reports`  
**Deferred gate:** **I54** — TTR report aggregate shape / population / unit (avg/median vs per-job-only; calendar vs elapsed)

---

## Objective

Provide a pure reports engine for auto (prior Mon–Sun) and manual (bounded inclusive range) performance metrics with Admin/DH scope, email fan-out, latest-manual in-app retention, and all-or-nothing generation — including TTR **raw cycles** while blocking invented TTR aggregate UX/DTO until I54 is decided.

---

## Business context

Admins and DHs need the same metric formulas on auto weekly email and on-demand manual runs. Auto is email-only for the previous Colombo Mon–Sun (triggered by F-010). Manual lets the requester pick dates (end ≤ today, span ≤ 90, single day OK), emails only the requester, and keeps the latest successful artifact in-app. Cancelled counts as volume events but is excluded from performance-outcome metrics. Metrics read Job + JobTimelineEvent (+ technician snapshots), not audit prose (ADR-006).

---

## User story

As Admin (or DH for my department), I run or receive a performance report for a period so I can see volume, aging, workload, quality/flow, and time-to-resolve inputs without leaving Assidua Ops.

---

## Functional requirements

### Authz & scope (FR-6.3, B9)

- FR-R1: **Admin** may run manual reports for **all departments** and receives auto all-dept reports.
- FR-R2: **DH** may run manual reports for **own department only** and receives auto own-dept reports.
- FR-R3: Front Desk, Coordinator, and technicians **cannot** run or access reports (Auth table / M5).

### Manual period bounds (B9, I46, I47)

- FR-R4: Requester picks inclusive start/end **calendar dates** Asia/Colombo: start 00:00:00 through end 23:59:59.
- FR-R5: Reject: end before start; end **after today** Colombo; inclusive span (end − start + 1) **> 90** days.
- FR-R6: Start = end (single day) is **allowed**.

### Auto period (FR-6.3)

- FR-R7: Auto period = previous complete **Mon–Sun** Asia/Colombo (Mon 00:00:00–Sun 23:59:59). Invoked by AO-F-010 Monday 08:00; this module owns generate + fan-out.

### Generation & delivery (I30, I24, I36)

- FR-R8: Generation is **all-or-nothing**: on failure, error; **no** partial artifact; manual may retry; auto waits next schedule (I30).
- FR-R9: **Manual:** after success, email **only the requester**; retain **latest** successful `ManualReportArtifact` per requester (replace on next success); if email fails → **in-app warning to actor** + artifact still available (I24/I36).
- FR-R10: **Auto:** email-only fan-out to all Admins (all-dept artifact/scope) and each DH (own-dept); **no** in-app auto archive / multi-week history (I36). Scheduled email best-effort (F-009).
- FR-R11: Report email is **always-on** (not FR-7.3 toggle) (AO-F-009 / ADR-004).

### Metric engine (Confirmed Weekly report; Decision 30–34)

Compute over Job + JobTimelineEvent (+ Technician directory snapshots). Same formulas for auto and manual over the period (except snapshots “at report time”).

- FR-R12 **Volume (events in period):** jobs **created** / **closed** / **cancelled** / **reopened** counts (reopened = reopen **actions**). Cancelled volume = cancellation events; Cancelled still excluded from performance outcomes (B1).
- FR-R13 **Aging:**
  - Open past deadline: snapshot at report time — jobs not Closed/Cancelled with deadline before now (scoped).
  - Avg/median **days to Close:** jobs Closed in period; create→Close **Colombo calendar-day** difference; Cancelled excluded; **N/A** if none Closed (I40/M26).
- FR-R14 **Workload (snapshot at report time):**
  - Open jobs per technician in scope; **include technicians with zero open jobs as 0** (M34). DH = dept pool; Admin = all technicians.
  - Unassigned New: count status New with no technician.
- FR-R15 **Quality/flow:**
  - On Hold count: snapshot currently On Hold.
  - On Hold rate: (entered On Hold ≥ once in period) ÷ (open at any time in period); mid-period Cancelled still count if they were open / entered On Hold; pre-period Cancelled excluded; **N/A** if denominator 0 (I23/I29/I32).
  - Reopen rate: reopen actions in period ÷ jobs Closed in period; **N/A** if denominator 0.
  - On Hold duration sum: total On Hold time **during the period** for jobs open at any time in period, including mid-period Cancelled (intervals clipped to period); pre-period Cancelled excluded (I32).
- FR-R16 **Performance outcomes** (aging averages/medians, TTR outcomes, etc.) **exclude Cancelled** jobs (B1).

### Time-to-resolve (I49) + **I54 GATE**

- FR-R17: **Include TTR on auto and manual** (I49). Persist/compute **raw cycles** from timeline:
  - primary: first Assigned → first Resolved
  - after reopen: also latest Assigned → following Resolved  
  Cancelled excluded from TTR performance outcomes. If no applicable cycle for a summary that would divide by zero / empty set, show **N/A** where an aggregate would otherwise be required.
- FR-R18: **I54 GATE — do not invent** final aggregate shape, population, or unit (avg/median vs per-job-only; calendar days vs elapsed). Report DTO exposes `timeToResolve: { status: "TBD_PENDING_I54", cycles: [...] }` (or equivalent) with **raw cycle data only**. UI may show a placeholder (“TTR pending decision”) + optional raw cycle list for Admin/DH debugging — **must not** ship invented avg/median/unit as product truth until requirements change for I54.

### Data source (ADR-006)

- FR-R19: Do **not** parse `AuditEntry` text for intervals. Require timeline events written by owning features (Created, Assigned, status, On Hold enter/exit, Reopen, Close, Cancel).

---

## Non-functional requirements

- NFR-3: All period bounds and calendar-day metrics use Asia/Colombo.
- NFR-4: NestJS enforces Admin/DH report authz.
- Pure metric functions preferred (testable without HTTP).
- Artifact storage: DB row/blob OK for MVP size (ADR-006).

---

## Acceptance criteria

### Manual bounds / authz

- Given Admin, when generating with valid inclusive range (end ≤ today, span ≤ 90, including single day), then generation succeeds for all-dept scope.
- Given DH, when generating for own dept with valid range, then succeeds; attempting cross-dept scope is impossible/rejected.
- Given end before start, future end, or span > 90, when submitting, then rejected.
- Given FD/Coordinator, when accessing report APIs/UI, then rejected.

### Delivery / retention

- Given successful manual generate, when email fails, then actor sees warning and latest in-app artifact is still available (I24).
- Given second successful manual generate by same user, when viewing in-app, then only the latest artifact is retained (I36).
- Given auto generate, when checking in-app history, then no multi-period auto archive is required (email-only).

### Metrics (non-TTR-aggregate)

- Given a period with volume events, when report is generated, then created/closed/cancelled/reopened counts reflect **events in period only**.
- Given no Closed jobs in period, when avg/median days-to-Close is shown, then **N/A**.
- Given technicians with zero open jobs, when workload is shown, then they appear as **0**.
- Given On Hold rate denominator 0, when shown, then **N/A**; same for reopen rate with zero Closed.
- Given mid-period Cancelled that was open / On Hold, when On Hold rate/duration computed, then included per I23/I32; performance-outcome metrics still exclude Cancelled.

### TTR / I54

- Given jobs with Assigned/Resolved timeline data, when report is generated, then raw TTR cycles are present in the artifact/DTO.
- Given I54 still open, when UI/API is reviewed, then **no** invented avg/median/unit is presented as final product metric; placeholder / `TBD_PENDING_I54` is explicit.
- Given empty applicable cycles, when a summary aggregate would be empty, then **N/A** (not a fabricated zero aggregate inventing I54).

### All-or-nothing

- Given generation failure mid-compute, when observing storage, then no partial manual artifact replaces the previous good latest (I30).

### Auto hook

- Given F-010 weekly trigger with prior Mon–Sun bounds, when `generateAndFanOutAutoWeekly` runs, then Admin all-dept + each DH own-dept emails are attempted with identical metric formulas for their scope.

---

## User-visible behavior

- Admin/DH: manual report form (date range); view/download latest manual artifact; receive emails (manual to self; auto on Monday).
- TTR section: placeholder pending I54 + raw cycles only (no fake aggregates).
- FD/Coordinator: no reports navigation/API.

---

## API behavior

| Method | Resource | Authz | Behavior |
|--------|----------|-------|----------|
| POST | `/reports/manual` | Admin (all); DH (own) | Body `{ startDate, endDate }`; generate; email requester; return artifact + optional `emailWarning` |
| GET | `/reports/manual/latest` | Admin/DH | Latest artifact for current user |
| (internal) | `ReportsService.generateAndFanOutAutoWeekly(period)` | F-010 | All-or-nothing generate per recipient scope + email |

---

## Data behavior

- `ManualReportArtifact`: requesterUserId (unique), scope, period start/end, payload JSON/blob, createdAt.
- Auto: ephemeral generate → email; no required retained auto rows (PLAN may log ops-only).
- Inputs: jobs, technicians, `JobTimelineEvent`.
- DTO includes metrics object + `timeToResolve: TBD_PENDING_I54` with `cycles[]`.

---

## Authorization

| Action | Admin | DH | Front desk | Coordinator | Tech |
|--------|-------|----|------------|-------------|------|
| Manual generate | Yes (all-dept) | Own dept | No | No | No |
| Latest manual in-app | Yes (own artifact) | Yes (own) | No | No | No |
| Auto email receive | Yes (all-dept) | Own dept | No | No | No |

---

## Error states

- Invalid manual range → rejected.
- Non-Admin/DH access → rejected.
- Generation failure → error; no partial replace of latest good artifact.
- Manual email failure → warning; artifact kept.
- Auto email failure → best-effort; no interactive actor.

---

## Edge cases

- Empty period metrics → zeros / N/A per formulas (not generation failure).
- DH with no technicians → workload empty list or all zeros — still valid report.
- Snapshot metrics use **report generation time**, not period end (Confirmed).
- Cancelled volume > 0 while outcome metrics exclude those jobs.

---

## Dependencies

- Timeline writers (F-005–007) + ADR-006.
- F-009 email + actor warning for manual.
- F-010 weekly cron trigger.
- F-002 roles; F-004 technician pool for workload zeros.
- **I54** requirements decision before final TTR aggregate UX/DTO.

---

## Constraints

- Do not invent I54 aggregates/units.
- Do not parse audit for metrics.
- Do not build multi-week in-app auto archive.
- Do not allow FD/Coordinator reports.
- Do not claim report email is toggled in FR-7.3 settings.

---

## Out of scope

- Scheduler cron itself (AO-F-010)
- Audit log viewer (AO-F-012)
- Resolving I54 (escalate for requirements change)
- Billing/analytics outside baseline metrics

---

## Test requirements

- Unit: period validation; each metric formula with fixtures; Cancelled exclusion; N/A denominators; tech zero workload; raw TTR cycles; no invented aggregate helper pretending I54 is decided.
- Integration: Authz; manual email fail → warning + artifact; auto fan-out calls; all-or-nothing failure.
- Playwright: DH manual single-day range; Admin span > 90 rejected; latest replaced; TTR placeholder visible; Coordinator denied.

---

## Definition of Done

- [ ] Spec human-approved (including I54 stance).
- [ ] PLAN + implementation meet AC; F-010 hook wired.
- [ ] Feature-owned tests + applicable E2E green.
- [ ] Build/type/lint clean; review passed.
- [ ] Breakdown row updated; I54 still listed open for later.

---

## Open questions / human decisions

1. **I54** remains deferred — this spec locks **raw cycles + `TBD_PENDING_I54` placeholder only**. Confirm that stance for MVP build (recommended) or supply a requirements change for aggregate shape/unit/population.

No other blockers.

---

## Human approval

**Approved (2026-08-12)** as written (raw TTR cycles; no invented aggregate until I54). PLAN may proceed for AO-F-011. No production code in this artifact.
