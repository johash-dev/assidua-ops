# AO-F-008 — SLA defaults, per-job override, deadline calc

**Feature ID:** AO-F-008  
**Parent:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED)  
**Breakdown:** `docs/specs/AO-MVP-001-feature-breakdown.md`  
**Depends on:** AO-F-005 (jobs with `deadlineAt`; department `defaultSlaDays` from AO-F-001)  
**Status:** HUMAN APPROVED (2026-08-12)  
**Module:** `sla`  
**Deferred notes:** Daily at-risk **delivery** = AO-F-010; channel adapters = AO-F-009. This feature owns deadline math, defaults, overrides, and bulk recalc.

---

## Objective

Own Asia/Colombo deadline calculation, department default N (DH own / Admin any) with optional bulk recalc of open jobs without override, and per-job deadline overrides — so create (F-005), reopen (F-007), and at-risk eligibility (F-010) share one SLA service without inventing pause/priority SLA rules.

---

## Business context

Critical window starts at job create: deadline = create calendar date + N days, due through end of that Colombo day. Department default N ≥ 1 (seed/default 10; no upper cap). DH/Admin may override a job’s deadline to a today-or-future date. Changing department default applies to new jobs; actor is prompted whether to recalculate existing open jobs that lack a per-job override. On Hold does not pause the clock. Cancelled exits the window (eligibility consumed by F-010). At-risk notifications fire only on the daily 08:00 job — not from this feature’s writes (M28).

---

## User story

As DH (or Admin), I set my department’s default critical-period length and override individual job deadlines when needed, and when I change the default I choose whether open jobs without overrides should be recalculated.

---

## Functional requirements

### Deadline calculation (FR-5.1, I4)

- FR-S1: `deadlineAt` = Asia/Colombo **end of calendar day** (23:59:59) of (**create calendar date + N** calendar days), where N = department `defaultSlaDays` unless a per-job override applies (I4).
- FR-S2: Provide a `sla` service helper used by AO-F-005 on create (and by reopen **restart** in AO-F-007: restart from **now’s** Colombo date + current department `defaultSlaDays`).
- FR-S3: **On Hold does not** change or pause `deadlineAt` (FR-5.3).
- FR-S4: **Priority** does not change SLA (baseline Confirmed).
- FR-S5: **Cancelled** jobs are not “open for SLA” (exit critical window / at-risk) (FR-5.4 / B1). Expose a pure eligibility helper for F-010: open = status ∉ {Closed, Cancelled}; at-risk calendar rule = Colombo date ≥ deadlineDate − 2 days. **Do not** send at-risk notifications here.

### Department default N (FR-5.1, FR-7.2, I43, I6, I26)

- FR-S6: Department `defaultSlaDays` must be integer **≥ 1**; reject 0/negative; **no upper cap** in MVP (I43).
- FR-S7: **DH** may set **their** department’s `defaultSlaDays`. **Admin** may set **any** department’s default (I26). FD/Coordinator cannot.
- FR-S8: On default change, request includes boolean **`updateOpenJobsWithoutOverride`** (architecture prompt flag):
  - If **false**: only subsequently created jobs use the new N; existing open deadlines unchanged.
  - If **true**: recalculate `deadlineAt` for **existing open** jobs (not Closed/Cancelled) in that department that have **no** per-job override, using each job’s **create date + new N**; jobs **with** per-job override unchanged (I6).
- FR-S9: Missing/omitted prompt flag is rejected (actor must choose) — or PLAN may default to `false` only if UI always sends an explicit choice; **tests must cover both true and false**. Prefer **explicit required boolean** to avoid silent bulk updates.
- FR-S10: Admin taxonomy create/edit of `defaultSlaDays` in AO-F-001 remains valid for seed/admin naming; **any change that alters N for an existing department must go through this SLA default-update path (or call the same service)** so the bulk prompt cannot be bypassed. PLAN wires a single service entrypoint.

### Per-job override (FR-5.1, I33)

- FR-S11: **DH** may set per-job override on **own-department open** jobs; **Admin** on **any open** job (I26).
- FR-S12: Override is a **deadline calendar date** (Asia/Colombo), not a separate N product path (Assumption 5). Date must be **today or future** Colombo; **past rejected** (I33). Stored as `deadlineAt` (EOD that date) and `perJobOverride = true`.
- FR-S13: Per-job override on Closed/Cancelled is **rejected** until Reopen (align with M14 open-job edits; reopen custom/restart handled in F-007 using this service).
- FR-S14: Clearing an override / reverting to default-derived deadline is **not** specified in baseline — **out of scope** (do not invent). New override may replace a previous override date.
- FR-S15: FD/Coordinator cannot set defaults or overrides. Technicians cannot.

### Audit

- FR-S16: Audit **SLA deadline overrides** and **department-default bulk update when chosen** (I17). Viewer = AO-F-012.

### Reopen alignment (consumes F-007)

- FR-S17: Expose helpers for F-007: **keep** (no deadline write), **restart** (create-from-today + dept N; clear or set override flag per PLAN — restart uses department default length, so `perJobOverride` should become **false** unless requirements say otherwise; baseline: “restart window from now (department default length)” → treat as non-override recalculation), **custom** (same validation as per-job override; set `perJobOverride = true`).

---

## Non-functional requirements

- NFR-3: All calendar math in **Asia/Colombo** (library TZ handling, not ad-hoc offsets).
- NFR-4: NestJS enforces DH/Admin scope.
- NFR-6: Last-write-wins on concurrent default/override edits.
- Repository-only DB; rules in `sla` service; taxonomy/jobs modules call `sla` (no cross-feature repository sharing).

---

## Acceptance criteria

### Calc / create path

- Given department `defaultSlaDays = 10` and job created on Colombo date D0, when deadline is computed, then `deadlineAt` is end of Colombo calendar day D0+10.
- Given On Hold for several days, when viewing deadline, then `deadlineAt` is unchanged.
- Given priority Urgent, when job is created or edited, then deadline is not auto-changed by priority.

### Department default

- Given DH, when they set own department `defaultSlaDays` to ≥ 1 with `updateOpenJobsWithoutOverride=false`, then default is stored and existing open deadlines unchanged; new jobs use new N.
- Given DH, when they set N with `updateOpenJobsWithoutOverride=true`, then open jobs in that dept **without** override get deadline = createDate + new N (EOD); jobs **with** override unchanged; Closed/Cancelled unchanged.
- Given DH, when they attempt to set another department’s default, then rejected.
- Given Admin, when they set another department’s default (same prompt rules), then allowed.
- Given N = 0 or negative, when saving, then rejected.
- Given FD or Coordinator, when attempting default change, then rejected.

### Per-job override

- Given open job, when DH (own dept) or Admin sets override to today or a future Colombo date, then `deadlineAt` is EOD that date and `perJobOverride` is true.
- Given past Colombo date override, when saving, then rejected.
- Given Closed/Cancelled, when override is attempted, then rejected.
- Given FD/Coordinator/tech, when override is attempted, then rejected.

### Audit

- Given successful per-job override or department default change (including bulk-true path), when audit storage is queried, then corresponding SLA override / bulk-update events exist (I17).

### Helpers (reopen / at-risk)

- Given restart helper with dept N, when applied from Colombo “today”, then deadline is today+N EOD and not treated as a stuck past keep.
- Given custom/restart past custom date, when validated, then rejected (same as I28/I33).
- Given eligibility helper, when job is Cancelled or Closed, then not open for SLA; when open and Colombo today ≥ deadlineDate−2, then at-risk-eligible (notification not sent here).

---

## User-visible behavior

- DH: configure own department default N with bulk-update prompt; set per-job override on own-dept open jobs.
- Admin: same for any department / any open job.
- FD/Coordinator/Tech: no SLA config controls (deadline still visible on boards/link via existing reads).
- No at-risk inbox/email UI in this feature (F-009/F-010).

---

## API behavior

| Method | Resource | Authz | Behavior |
|--------|----------|-------|----------|
| PATCH | `/departments/:id/sla-default` | DH if own dept; Admin any | Body `{ defaultSlaDays, updateOpenJobsWithoutOverride }` |
| PATCH | `/jobs/:id/sla-override` | DH own dept if open; Admin if open | Body `{ deadlineDate }` (Colombo date); sets override |
| GET | (optional) `/jobs/:id` already returns deadline | — | No separate public calc endpoint required |

Internal: `SlaService.computeDeadlineFromCreate(createAt, n)`, `applyDepartmentDefaultChange(...)`, `applyPerJobOverride(...)`, `applyReopenDeadline(mode, ...)`, `isOpenForSla(job)`, `isAtRiskEligible(job, todayColombo)`.

---

## Data behavior

- `Department.defaultSlaDays`: int ≥ 1 (owned field; mutations for existing depts via sla path).
- `Job.deadlineAt`: timestamptz (logical Colombo EOD).
- `Job.perJobOverride`: boolean (true when deadline set via override or reopen custom).
- Open for bulk/override = status ∉ {Closed, Cancelled}.

---

## Authorization

| Action | Admin | DH | Front desk | Coordinator | Tech link |
|--------|-------|----|------------|-------------|-----------|
| Set department default N (+ bulk flag) | Yes (any dept) | Own dept | No | No | No |
| Per-job override (open jobs) | Yes (any) | Own dept | No | No | No |
| View deadline on job | Yes | Own dept (F-005 scope) | Yes | Yes | Yes (I27) |

---

## Error states

- `defaultSlaDays` < 1 → rejected.
- Missing explicit `updateOpenJobsWithoutOverride` when required → rejected.
- DH other-department default → rejected.
- Per-job / custom deadline past Colombo today → rejected.
- Override on Closed/Cancelled → rejected.
- FD/Coordinator/tech SLA mutate → rejected.

---

## Edge cases

- Bulk true with mix of overridden and non-overridden open jobs: only non-override rows recalc.
- Job created then department default changed with bulk false: job keeps original deadline.
- Reclassify to another department (F-005) does **not** auto-recalc deadline unless a later requirements change says so — **do not invent**; deadline remains until override/reopen/bulk targets it.
- Admin sets default on dept with no open jobs: flag true is a no-op recalc; default still updates.
- Multi-instance scheduler assumption is F-010; this feature is request-scoped.

---

## Dependencies

- AO-F-001 `defaultSlaDays` field + seed.
- AO-F-002 roles / DH binding.
- AO-F-005 jobs + create calling compute helper.
- AO-F-007 reopen calling applyReopenDeadline.
- AO-F-010 consumes eligibility helper for daily at-risk.
- Audit write helper.

---

## Constraints

- Do not invent On Hold pause.
- Do not invent priority-based SLA.
- Do not invent clear-override product without requirements.
- Do not send at-risk or weekly emails here.
- Do not bypass bulk prompt on department N change.
- Do not invent upper cap on N.

---

## Out of scope

- Daily at-risk cron / send (AO-F-010)
- Notification settings / adapters (AO-F-009)
- Performance report aging display (AO-F-011)
- Reopen/Close/Cancel actions (AO-F-007) — helpers only
- Job create UI (AO-F-005)

---

## Test requirements

- Unit: createDate+N EOD; N≥1; bulk true/false; override past reject; Closed reject; On Hold unchanged; eligibility helper; reopen restart/custom helpers; DH scope.
- Integration: HTTP authz for default + override.
- Playwright: DH changes default with bulk true and sees open non-override deadline move; override past date rejected; Admin cross-dept default allowed; FD denied.

---

## Definition of Done

- [ ] Spec human-approved.
- [ ] PLAN + implementation meet AC; F-005/F-007 call shared helpers.
- [ ] Feature-owned tests + applicable E2E green.
- [ ] Build/type/lint clean; review passed.
- [ ] Breakdown row updated.

---

## Open questions / human decisions

1. **Explicit `updateOpenJobsWithoutOverride` required** (recommended) vs UI-only with server default `false`. Confirm required boolean on API.
2. Reclassify department change: baseline silent on deadline — this spec **leaves deadline unchanged** (no invent). Confirm OK.

No other blockers.

---

## Human approval

**Approved (2026-08-12)** as written (required bulk flag; no reclassify auto-recalc; no clear-override). PLAN may proceed for AO-F-008. No production code in this artifact.
