# AO-F-009 — Notifications (settings, adapters, actor warnings)

**Feature ID:** AO-F-009  
**Parent:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN + RC-001 / I58); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED + RC-001 amend); ADR-004, ADR-005, ADR-008  
**Breakdown:** `docs/specs/AO-MVP-001-feature-breakdown.md`  
**Depends on:** AO-F-002 (staff users/roles for recipients + Admin settings authz); consumed by AO-F-005–008 emits / AO-F-006 WhatsApp / AO-F-010–011 scheduled sends  
**Status:** HUMAN APPROVED (2026-08-12); **RC-001 amend HUMAN CONFIRMED** (2026-08-13)  
**Module:** `notifications`  
**Deferred notes:** **NFR-1 / M42** — no product delivery SLA; adapter-bounded retry only. WhatsApp assignment UX/copyable remains AO-F-006; this feature owns the shared adapters + orchestrator.

---

## Objective

Provide Admin-configurable in-app/email toggles per staff event type, Admin customer-SMS enable + English template (FR-7.4), a post-commit `NotificationOrchestrator` with InApp/Email/WhatsApp/SMS adapters, fixed role-based recipients, in-app inbox, and actor failure warnings — without inventing configurable recipients, audit of settings, or scheduled cron itself.

---

## Business context

Staff events (new job, department change, at-risk) notify fixed recipients with default in-app + email. Admin may turn in-app and/or email off per event type; recipients never change. Customer inquiry SMS is a separate Admin toggle (default **off**) + editable English template requiring `{INQUIRY_NUMBER}` and `{JOB_COUNT}` (RC-001). Action-triggered email or customer-SMS failure → in-app warning to the actor; primary action already committed. In-app delivery is best-effort (no failure UX). Technician WhatsApp is not a staff toggle. Weekly/manual report email is always-on operational mail (not a staff event toggle unless requirements later add one).

---

## User story

As Admin, I turn in-app and/or email on or off per notification event type, and I enable/configure the customer inquiry SMS template; as staff, I see in-app notifications in an inbox; as any actor whose action triggers email or customer SMS, I get a warning if that send fails while my primary action still succeeds.

---

## Functional requirements

### Settings (FR-7.3–7.4)

- FR-N1: Admin may configure **per event type** toggles: **in-app** on/off and **email** on/off (FR-7.3). Defaults: **both on** for staff event types (Confirmed Notifications).
- FR-N2: Staff MVP event types with toggles: `JOB_CREATED`, `JOB_DEPT_CHANGED`, `JOB_AT_RISK` (architecture).
- FR-N3: **Recipients are fixed** by role rules — settings must not change who receives (Confirmed).
- FR-N4: **Weekly/auto and manual report emails** are **always-on** operational mail under NFR-1 — **not** exposed as FR-7.3 toggles in MVP (ADR-004). Report modules call the email adapter/orchestrator report path directly.
- FR-N5: WhatsApp technician-link delivery is **not** an Admin in-app/email toggle (Confirmed).
- FR-N6: Only **Admin** may view/edit notification settings. DH/FD/Coordinator cannot (Auth table / M5).
- FR-N7: Notification setting changes (including customer SMS toggle/template) are **not** required in MVP audit (I45 / RC-001).
- FR-N22: Admin may enable/disable **customer inquiry SMS** (`customerSmsEnabled`, default **false**) and edit `customerSmsTemplate` (English). Template save **rejected** unless both `{INQUIRY_NUMBER}` and `{JOB_COUNT}` are present. Seed template: `Thank you. We received your inquiry {INQUIRY_NUMBER} with {JOB_COUNT} job(s).` (FR-7.4 / RC-001).
- FR-N23: **No** manual resend of customer SMS in MVP.

### Recipients (fixed)

- FR-N8: `JOB_CREATED` → owning department’s **single DH** (may be self if DH created) (I9 / Assumption 2).
- FR-N9: `JOB_DEPT_CHANGED` → old DH + new DH; if same person, **one** notification (M32 / M38).
- FR-N10: `JOB_AT_RISK` → owning DH + **all Admin-role users** (Confirmed). Scheduler (F-010) emits; this feature delivers.
- FR-N11: Manual report email → **only the requester** (F-011). Auto weekly fan-out → all Admins (all-dept) + each DH (own dept) (F-011/F-010).

### Orchestrator & adapters (ADR-004)

- FR-N12: Domain services **commit first**, then call `NotificationOrchestrator` **after commit / outside** the business transaction.
- FR-N13: Orchestrator resolves recipients, reads `NotificationSetting` for staff event types, then:
  - **InAppChannel** — best-effort write of `InAppNotification`; **no** required failure UX (M19).
  - **EmailChannel** — if email toggle on (staff events): send; on **action-triggered** failure return/surface **in-app warning to actor**; primary action remains succeeded (I18). **Scheduled** email (at-risk, auto weekly): best-effort; no interactive actor warning required.
  - **WhatsAppChannel** — used by AO-F-006 assign/regenerate only; failure must not roll back assignment; caller supplies/receives `copyableText` (I52). Owned adapter lives here; F-006 owns assign transaction boundary.
  - **SmsChannel** — used for `CUSTOMER_INQUIRY_CREATED` only when `customerSmsEnabled`; send to customer phone with substituted template; failure must not roll back inquiry create; surface **in-app warning to actor** (FR-1.9 / ADR-008).
- FR-N14: Providers behind interfaces only; no business logic in SDKs. Dev-tier providers per ADR-005 (Mailtrap local email; Resend staging; Meta WhatsApp sandbox) + **fake/log SMS** (ADR-008). Credentials env-only; never committed.
- FR-N15: Adapters may use short **bounded** internal retries; **no** user-visible multi-retry product; **no** claimed business durability SLA (NFR-1/M42).

### In-app inbox

- FR-N16: Authenticated staff may list their own `InAppNotification` rows (read inbox). MVP: mark-read is **PLAN-optional** if not in baseline — baseline requires delivery/best-effort, not a rich inbox product. Minimum: **list recent notifications for current user**. Do not invent snooze/archive/preferences beyond Admin event toggles.
- FR-N17: Actor warning for failed action-triggered email **or customer SMS** may be returned on the mutating API response **and/or** written as an in-app notification to the actor — PLAN picks one observable path; tests must assert actor sees the warning (I18 / FR-1.9).

### Emit contracts (consumers)

- FR-N18: AO-F-005 emits `JOB_CREATED` / `JOB_DEPT_CHANGED` after commit, and **once per inquiry** `CUSTOMER_INQUIRY_CREATED` (inquiryNumber, jobCount, customerPhone).
- FR-N19: AO-F-010 emits `JOB_AT_RISK` per eligible job (or batch) after eligibility check.
- FR-N20: AO-F-006 calls WhatsAppChannel after assign commit.
- FR-N21: AO-F-011 uses email path for manual/auto report (always-on).
- FR-N24: When `CUSTOMER_INQUIRY_CREATED` fires and SMS is disabled, orchestrator no-ops SMS (no send). When enabled, **exactly one** SMS attempt per emit.

---

## Non-functional requirements

- NFR-1: Channels required; reliability beyond WhatsApp→copyable and I18 warnings is implementation-constrained only.
- NFR-4: Admin-only settings; inbox scoped to current user.
- CI uses **fake** Email/WhatsApp/SMS adapters (no live providers).

---

## Acceptance criteria

### Settings

- Given Admin, when they turn email off for `JOB_CREATED`, then subsequent creates still succeed, owning DH may still get in-app (if on), and **no** email is sent for that event.
- Given Admin, when they turn both channels off for an event, then no in-app row and no email for that event; domain action still succeeds.
- Given DH/FD/Coordinator, when accessing settings APIs/UI, then rejected.
- Given settings change, when audit is queried, then **no** requirement to have a settings audit event (I45).
- Given Admin saves customer SMS template missing `{INQUIRY_NUMBER}` or `{JOB_COUNT}`, when saving, then rejected.
- Given customer SMS default, when go-live seed is inspected, then `customerSmsEnabled` is **false**.
- Given Admin enables customer SMS, when F-005 creates a multi-job inquiry, then **exactly one** SMS is attempted with substituted inquiry number and job count.
- Given customer SMS disabled, when inquiry is created, then no SMS send.

### Delivery / warnings

- Given `JOB_CREATED` with defaults on, when a job is created, then owning DH receives in-app (best-effort) and email attempt.
- Given `JOB_DEPT_CHANGED` where old and new DH are the same user, when notified, then **one** delivery (not two).
- Given action-triggered email adapter fails, when the actor’s API response/inbox is observed, then an in-app warning is visible to the actor and the primary action remains committed (I18).
- Given customer SMS enabled and SMS adapter fails, when inquiry create completes, then create remains committed and actor sees an in-app warning (FR-1.9).
- Given in-app channel write fails, when observing UX, then no required failure UX; primary action remains committed (M19).
- Given scheduled at-risk/auto email fail, when no interactive actor, then best-effort only (no I18 actor warning requirement).

### WhatsApp adapter

- Given F-006 assign with WhatsApp adapter fail, when assign completes, then assignment committed and `copyableText` available (F-006 AC); notifications module does not roll back caller’s transaction.

### Inbox

- Given staff user with in-app notifications, when they open inbox, then their notifications are listed (not other users’).

### Adapter isolation

- Given CI/unit tests, when adapters run, then fakes are used (no live Mailtrap/Resend/Meta/SMS required).

---

## User-visible behavior

- Admin: notification settings page (per-event in-app/email toggles for JOB_CREATED, JOB_DEPT_CHANGED, JOB_AT_RISK) **plus** customer SMS enable + template editor.
- Staff: in-app notification inbox (own rows); actor warning when action email or customer SMS fails.
- No recipient picker. No WhatsApp toggle. No report-email toggle. No customer-SMS resend in MVP settings.

---

## API behavior

| Method | Resource | Authz | Behavior |
|--------|----------|-------|----------|
| GET | `/notification-settings` | Admin | List event types + inApp/email booleans; customer SMS enable + template |
| PUT/PATCH | `/notification-settings` | Admin | Update staff toggles and/or customer SMS enable + template |
| GET | `/notifications` (inbox) | Authenticated staff | Current user’s in-app notifications |
| (internal) | `NotificationOrchestrator.notify(event)` | Domain services | Post-commit fan-out |
| (internal) | `WhatsAppSender.send` | assignment module | After assign commit |
| (internal) | `SmsSender.send` | orchestrator | After inquiry create when enabled |

Mutating domain APIs that trigger action email or customer SMS should return an optional `emailWarning` / `smsWarning` (or equivalent) when I18 / FR-1.9 applies.

---

## Data behavior

- `NotificationSetting`: eventType, inAppEnabled, emailEnabled (unique per eventType).
- `CustomerSmsSetting` (singleton or equivalent): enabled (default false), template (seed per FR-N22).
- `InAppNotification`: id, staffUserId, eventType, title/body or payload ref, createdAt, readAt? (optional).
- Seed defaults: all three staff event types with inApp=true, email=true; customer SMS enabled=false + seed template.
- No audit rows required for settings mutations.

---

## Authorization

| Action | Admin | DH | Front desk | Coordinator | Tech link |
|--------|-------|----|------------|-------------|-----------|
| Configure channel toggles | Yes | No | No | No | No |
| Configure customer SMS toggle + template | Yes | No | No | No | No |
| Receive JOB_CREATED / DEPT_CHANGED | If also DH for that dept | Yes (as DH) | No (unless also DH — N/A) | No | No |
| Receive JOB_AT_RISK | Yes (all Admins) | Owning DH | No | No | No |
| View own in-app inbox | Yes | Yes | Yes | Yes | No |
| WhatsApp tech link | — | — | — | — | Via F-006 |

---

## Error states

- Non-Admin settings mutate/read → rejected.
- Inbox for another user → not exposed.
- Email/WhatsApp/SMS provider errors → handled per I18/I52/M19/FR-1.9; do not fail committed domain write.
- Unknown event type toggle → rejected.
- Customer SMS template missing required placeholders → save rejected.

---

## Edge cases

- DH creates job in own department: self-notify allowed.
- Same-DH dept change: single notify.
- Both toggles off: silent for channels; domain success.
- Report email path ignores staff event toggles (always-on).
- Multi-job create: one JOB_CREATED per job / per owning DH (F-005); **one** customer SMS for the inquiry (RC-001).

---

## Dependencies

- AO-F-002 staff users, roles, DH↔department, emails for EmailChannel.
- Emitters: F-005 (jobs + customer SMS), F-006 (WhatsApp), F-010 (at-risk), F-011 (reports).
- ADR-004/005/008 adapter + dev-tier config.

---

## Constraints

- Do not invent configurable recipients.
- Do not invent settings audit requirement (I45).
- Do not invent report-email or WhatsApp Admin toggles.
- Do not invent customer SMS resend.
- Do not claim NFR-1 durability / product retry UX.
- Do not call provider SDKs from domain modules.
- Do not implement at-risk cron or report generation here.

---

## Out of scope

- Scheduler cron (AO-F-010)
- Report metric generation / fan-out content (AO-F-011) — email send hook only
- Assignment select UX / copyable UI (AO-F-006)
- Rich notification preferences per user
- Push / chat / multi-language SMS
- Manual customer SMS resend

---

## Test requirements

- Unit: recipient resolution; same-DH dedupe; toggles gate channels; customer SMS placeholder validation; orchestrator does not require domain rollback; I18/FR-1.9 warning signal; M19 swallow in-app fail; one SMS per multi-job inquiry.
- Integration: Admin settings authz; inbox isolation; fake email/SMS fail → warning on action API.
- Playwright: Admin disables email for JOB_CREATED; create job → no email fake call / in-app still if on; Admin enables SMS + create multi-job → one SMS fake call; non-Admin settings denied; actor warning path with email/SMS fake fail.

---

## Definition of Done

- [ ] Spec human-approved.
- [ ] PLAN + implementation meet AC; emitters wired post-commit.
- [ ] Feature-owned tests + applicable E2E green; adapters faked in CI.
- [ ] Build/type/lint clean; review passed.
- [ ] Breakdown row updated.

---

## Open questions / human decisions

1. Actor email warning: API field vs in-app row vs both — **PLAN choice** if both satisfy I18 observability. Confirm OK.
2. Inbox mark-read: optional in PLAN (not baseline-mandated). Confirm OK to ship list-only MVP.

No other blockers. NFR-1/M42 remain intentionally open at adapter bound only.

---

## Human approval

**Approved (2026-08-12)** as written (always-on report email; no settings audit; NFR-1 adapter-only).  
**RC-001 amend (2026-08-13)** — customer SMS settings + SmsChannel — **HUMAN CONFIRMED**. PLAN may include the SMS path.
