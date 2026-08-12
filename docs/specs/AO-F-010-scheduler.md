# AO-F-010 — Scheduler (Colombo at-risk + weekly auto trigger)

**Feature ID:** AO-F-010  
**Parent:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED); ADR-001, ADR-004  
**Breakdown:** `docs/specs/AO-MVP-001-feature-breakdown.md`  
**Depends on:** AO-F-008 (SLA eligibility / deadline helpers), AO-F-009 (JOB_AT_RISK delivery); AO-F-011 reports engine for weekly auto generate + fan-out  
**Status:** HUMAN APPROVED (2026-08-12)  
**Module:** `scheduler`  
**Constraint note:** **ponytail:** MVP assumes a **single** NestJS instance running cron; upgrade path = distributed lock / external scheduler (ADR-001).

---

## Objective

Run Asia/Colombo in-process cron jobs that (1) send daily at-risk notifications for eligible open jobs at 08:00 and (2) trigger the weekly auto performance report for the previous Mon–Sun at Monday 08:00 — without implementing report metrics, Admin toggles, or immediate at-risk on domain actions.

---

## Business context

At-risk prompts fire only on the daily 08:00 Colombo schedule (not on reopen or other writes — M28). Weekly auto reports are email-only for the prior complete Mon–Sun week, triggered Monday 08:00 Colombo. Both schedules live in the NestJS process alongside the API (ADR-001). Delivery uses F-009 adapters (scheduled = best-effort). Report content and fan-out rules are owned by AO-F-011; this feature only triggers that engine on schedule.

---

## User story

As the system, every morning at 08:00 Asia/Colombo I notify DHs and Admins about jobs in the at-risk window, and every Monday at 08:00 I kick off the prior week’s auto performance report emails.

---

## Functional requirements

### Runtime (ADR-001)

- FR-K1: Host scheduled workers **in-process** on the NestJS API with cron timezone **explicitly `Asia/Colombo`** (NFR-3). No separate worker service or queue product for MVP.
- FR-K2: Document **single-instance scheduler** assumption. Do not invent distributed locks in this slice; if multi-instance deploy is later required, escalate (ponytail ceiling named above).
- FR-K3: No public staff UI required to “run scheduler” in MVP. Optional Admin/dev **manual trigger** endpoints for test/ops are PLAN-optional and must be auth-gated (Admin-only) if added — not a business requirement.

### Daily at-risk (FR-5.2, I4, I5, M28)

- FR-K4: Cron: **daily 08:00 Asia/Colombo**.
- FR-K5: For each job where `SlaService.isAtRiskEligible(job, todayColombo)` is true (open ≠ Closed/Cancelled; Colombo calendar date ≥ deadlineDate − 2 days — F-008), emit `JOB_AT_RISK` via `NotificationOrchestrator` after any read-only selection work (no domain status mutation).
- FR-K6: Recipients fixed by F-009: owning DH + all Admin-role users; channel toggles apply.
- FR-K7: **Cancelled** (and Closed) jobs are **excluded** (B1 / FR-5.4).
- FR-K8: **Do not** send at-risk from reopen, override, create, or other action paths — schedule only (M28).
- FR-K9: On Hold jobs remain eligible if open and in window (clock not paused — FR-5.3).
- FR-K10: Scheduled delivery is **best-effort** (no interactive actor warning) (I18/F-009). Continue other jobs if one notify fails (PLAN: per-job try/catch so one failure does not abort the whole run).
- FR-K11: Same job may notify on **each** eligible daily run until Closed/Cancelled (baseline: daily while eligible). Do not invent “notify once ever” suppression.

### Weekly auto report trigger (FR-6.3, I5, I30)

- FR-K12: Cron: **Monday 08:00 Asia/Colombo**.
- FR-K13: Compute period = **previous complete Mon–Sun** Asia/Colombo (Monday 00:00:00 through Sunday 23:59:59 of that week) (baseline auto week rule).
- FR-K14: Call **reports** module (AO-F-011) to **generate all-or-nothing** auto report(s) and **email fan-out**: all Admins (all-department scope) + each DH (own-department scope). Auto is **email-only** (no in-app auto archive) (I36).
- FR-K15: This feature does **not** own metric formulas, TTR shape (I54), or manual report UI — only the schedule trigger + period bounds passed into F-011.
- FR-K16: If F-011 generation fails, no partial artifact (I30); scheduler logs/records failure; next Monday retries naturally. No interactive actor.

### Non-goals inside scheduler

- FR-K17: No WhatsApp from scheduler. No audit requirement for “cron ran” unless PLAN adds ops logging (not I17 business audit).

---

## Non-functional requirements

- NFR-3: All schedule walls and period bounds in Asia/Colombo.
- NFR-1: Scheduled email/in-app best-effort via F-009.
- Tests: use fake clocks / manual invoke of job handlers (do not wait for real Monday in CI).

---

## Acceptance criteria

### At-risk job

- Given an open job whose Colombo deadline date is D, when the daily job runs on Colombo date ≥ D−2, then `JOB_AT_RISK` is emitted for that job to owning DH + all Admins (subject to F-009 toggles).
- Given the same job still open and eligible the next day, when the daily job runs again, then at-risk is emitted again.
- Given a job is Cancelled (or Closed) while previously eligible, when the next daily run occurs, then that job is not included.
- Given reopen keeps a past deadline (F-007), when reopen completes, then **no** immediate at-risk; the job is included only on a subsequent 08:00 run if still eligible (M28).
- Given On Hold + eligible window, when daily run occurs, then job is included.
- Given one job’s notify throws, when the run continues, then other eligible jobs are still processed (isolation).

### Weekly trigger

- Given Monday 08:00 Colombo (simulated), when weekly cron fires, then F-011 is invoked with previous Mon–Sun Colombo bounds for auto generation + email fan-out.
- Given F-011 generation fails, when observing artifacts, then no partial auto report is retained (I30); scheduler does not invent a substitute report.

### Runtime

- Given NestJS cron config, when inspected, then both jobs declare timezone `Asia/Colombo` (or equivalent explicit TZ binding).
- Given documentation/PLAN, when multi-instance is discussed, then single-scheduler assumption / upgrade path is stated (ponytail).

---

## User-visible behavior

- Staff: receive at-risk in-app/email per F-009; receive auto weekly email per F-011 (no scheduler settings UI in MVP).
- No “run at-risk now” business UI required.

---

## API behavior

| Surface | Authz | Behavior |
|---------|-------|----------|
| NestJS cron `AtRiskJob` | System | Daily 08:00 Colombo; select eligible jobs; notify |
| NestJS cron `WeeklyAutoReportJob` | System | Monday 08:00 Colombo; invoke reports auto for prior Mon–Sun |
| Optional `POST /admin/scheduler/at-risk/run` | Admin only if PLAN adds | Manual invoke for tests/ops |
| Optional `POST /admin/scheduler/weekly-auto/run` | Admin only if PLAN adds | Manual invoke for tests/ops |

No FD/DH/Coordinator scheduler controls.

---

## Data behavior

- No new business entities required. Optional ops `SchedulerRunLog` is PLAN-only (not baseline).
- Reads jobs + deadlines via services (jobs/sla); does not write job status.
- Writes only via notifications/reports side effects.

---

## Authorization

| Action | Admin | DH | Front desk | Coordinator | System cron |
|--------|-------|----|------------|-------------|-------------|
| Receive at-risk | Yes | Owning DH | No | No | — |
| Receive auto weekly email | Yes (all-dept) | Own dept | No | No | — |
| Configure cron | Ops/deploy | No | No | No | — |
| Manual trigger (if any) | Yes only | No | No | No | — |

---

## Error states

- Notify failure for one job → log; continue (best-effort).
- Reports auto generation failure → no partial artifact; log; end run.
- Clock/TZ misconfiguration → treat as deploy defect; tests assert Colombo binding.

---

## Edge cases

- Job enters at-risk window mid-day: first notify is next 08:00 (no immediate).
- Past-deadline open jobs remain eligible every day until Closed/Cancelled.
- Monday 08:00 runs **both** daily at-risk and weekly auto (order PLAN-flexible; prefer at-risk then weekly or independent — both must run that morning).
- Empty eligible set / empty report period: at-risk no-ops; weekly still invokes F-011 (F-011 defines empty-metric N/A behavior).

---

## Dependencies

- AO-F-008 `isAtRiskEligible` / open-for-SLA helpers.
- AO-F-009 `JOB_AT_RISK` orchestrator path (scheduled best-effort).
- AO-F-011 `generateAndFanOutAutoWeekly(period)` (or equivalent).
- AO-F-002 Admin/DH directory for recipients (via F-009/F-011).
- ADR-001 in-process single-instance cron.

---

## Constraints

- Do not send immediate at-risk from domain actions.
- Do not invent queue/microservice workers for MVP.
- Do not implement report metrics here.
- Do not invent “notify once per job lifetime” suppression.
- Do not silently assume multi-instance safety without a lock (document ponytail).

---

## Out of scope

- Performance metric engine / manual reports / TTR DTO (AO-F-011; I54)
- Notification settings UI (AO-F-009)
- SLA override UX (AO-F-008)
- Distributed cron locking product

---

## Test requirements

- Unit: eligibility selection excludes Closed/Cancelled; includes On Hold in window; period bounds = previous Mon–Sun; no at-risk call from reopen path (owned elsewhere — assert scheduler is sole emitter in integration).
- Integration: invoke handlers with fake clock + fake notifications/reports; verify fan-out calls; failure isolation.
- Playwright optional: Admin seed eligible job → trigger at-risk run → inbox/email fake received; Cancelled job not notified.

---

## Definition of Done

- [ ] Spec human-approved (including single-instance ponytail).
- [ ] PLAN + implementation meet AC; F-011 hook defined.
- [ ] Feature-owned tests with fake clock green.
- [ ] Build/type/lint clean; review passed.
- [ ] Breakdown row updated.

---

## Open questions / human decisions

1. Optional Admin manual trigger endpoints for QA — **PLAN choice** (recommended for testability). Confirm OK.
2. Monday 08:00 job ordering (at-risk vs weekly) — **PLAN choice**; both must run.

No other blockers. F-011 may still be draft when this is approved; weekly AC is satisfied by a defined service contract + fakes until F-011 lands.

---

## Human approval

**Approved (2026-08-12)** as written (schedule-only at-risk; single-instance ponytail; weekly triggers F-011). PLAN may proceed for AO-F-010. No production code in this artifact.
