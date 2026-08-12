# Assidua Ops — MVP Architecture Design

**Feature ID:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN 2026-08-11 + RC-001 / I58 HUMAN APPROVED 2026-08-13)  
**Stack authority:** project README (Next.js App Router + React + TypeScript; NestJS + TypeScript; PostgreSQL + Prisma; modular monolith; feature-first; service-owned rules; repository-only DB access; server-side authorization; transactional writes; append-only audit; decoupled notifications; Playwright; GitHub Flow)  
**Status:** Architecture — **HUMAN APPROVED** (2026-08-12); **RC-001 amend HUMAN CONFIRMED** (2026-08-13); **UI foundation (ADR-009) HUMAN CONFIRMED** (2026-08-13)  
**Scope:** Design only. No production code. No implementation plan.

---

## Problem

Staff need a shared system of record for customer inquiries and department-owned service jobs: leaf-category intake (with customer-facing inquiry numbers and optional customer SMS acknowledgement), technician assignment via WhatsApp shareable links (no tech login), SLA critical window with at-risk prompts, notes, Close/Cancel/Reopen, audit, and weekly/manual performance reports — within Assidua modular-monolith constraints.

**Trace:** Objective; User story; FR-1–FR-8; NFR-1–NFR-8; RC-001 / I58.

---

## Current behavior

**Greenfield.** This repository contains agents/skills and the frozen requirements baseline only. No application runtime, schema, or UI exists yet.

**Supplied platform pattern (authoritative, not invented):** modular monolith with Next.js staff/tech UI, NestJS API, PostgreSQL via Prisma, feature-first backend modules, Controller → Service → Repository → Prisma → PostgreSQL, transactional writes, append-only audit, decoupled notification adapters.

---

## Affected features

All MVP product surfaces (new):

| Capability | Requirements |
|------------|--------------|
| Staff auth + single role | FR-6.1, FR-7.1, I44/I50, Auth table |
| Taxonomy (dept/leaf) | Departments/categories; FR-7.1; B5/M17 |
| Customers + sites | FR-1.1–1.2; B7; M27 |
| Inquiry + multi-job intake | FR-1.3–1.9; M20/M29; RC-001 / I58 |
| Job edit / reclassify | FR-8; FR-4.3; I8/I31/M32 |
| Technician directory | FR-2; FR-7.1–7.2; B4; I53 |
| Assignment + WhatsApp link | FR-2; FR-3; NFR-5; I42/I52 |
| Lifecycle (status/Close/Cancel/Reopen) | FR-4; B8; I20; M41 |
| Notes (add-only) | FR-4.4; I35/I39/I48 |
| SLA + at-risk schedule | FR-5; I4/I5; M28 |
| Notifications (in-app/email + toggles) | FR-1.5; FR-7.3; I18/M19 |
| Performance reports | FR-6.3; B9; I46–I49 |
| Audit log | FR-6.2; NFR-2; I17/I45 |

---

## Existing patterns

Reuse **platform rules** (no prior feature code):

1. Modular monolith — no microservices for convenience.
2. Feature-first NestJS modules; business rules in services; repositories own Prisma.
3. Thin controllers; server-side authorization.
4. Transactional multi-write (e.g. atomic multi-job create).
5. Append-only audit / history.
6. Decoupled notification providers behind interfaces.
7. Feature-owned tests; Playwright for completed user flows.
8. Rule of three before shared extraction.
9. Asia/Colombo as business calendar (NFR-3) — library timezone handling, not ad-hoc offsets.

---

## Proposed design

### System / component boundaries

```text
┌─────────────────────────────────────────────────────────────┐
│ Staff browsers / Technician browsers                        │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────┐
│ Next.js App Router (UI)   │   │ Public tech link routes     │
│ - staff session cookies   │   │ /t/[token] (no staff auth)  │
│ - BFF-style calls to API  │   │ allow-list fields only      │
└─────────────┬─────────────┘   └──────────────┬──────────────┘
              │ HTTPS JSON                     │
              ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│ NestJS modular monolith (single deployable API)             │
│  Controllers → Services → Repositories → Prisma             │
│  AuthZ guards · Domain services · notify adapters · Cron    │
└─────────────┬───────────────────────┬───────────────────────┘
              │                       │
              ▼                       ▼
     ┌────────────────┐    ┌──────────────────────────────┐
     │ PostgreSQL     │    │ External adapters            │
     │ (Prisma)       │    │ Email · WhatsApp · SMS · (clock) │
     └────────────────┘    └──────────────────────────────┘
```

**One** NestJS process hosts HTTP API + scheduled workers (at-risk 08:00, weekly report Monday 08:00 Asia/Colombo). No separate microservice or queue product required for MVP volume (**YAGNI**; escalate if volume proves otherwise).

**Trace:** Assidua constraints; NFR-3; FR-5.2; FR-6.3.

### Feature modules (backend)

| Module | Owns | Trace |
|--------|------|-------|
| `identity` | Staff users, login/session, exactly-one-role, sole/dual DH replacement | FR-7.1; I38/I44/I50; M35 |
| `taxonomy` | Departments, category tree/leaves, deactivate guards | Confirmed taxonomy; FR-7.1; B5 |
| `customers` | Customer search/create/edit; sites create/edit/delete rules | FR-1.1–1.2; B7 |
| `jobs` | Inquiry+job create (atomic) + inquiry number allocation; job field edits (FD until tech select; DH/Admin while open); reclassify; DH visibility + sibling indicator | FR-1; FR-8; FR-4.3; I41/I51; M14; RC-001 / I58 |
| `technicians` | Directory CRUD/deactivate; primary-dept change guards | FR-7.1–7.2; B4; I53 |
| `assignment` | Select/reassign/regenerate; first select New→Assigned; reassign/regenerate keep the existing status; Closed/Cancelled rejected; link issue + WhatsApp/copyable | FR-2; I15/I52 |
| `lifecycle` | Tech/DH/Admin status rules; Close/Cancel/Reopen; cancel-reason edit | FR-3–4; B8; M41 |
| `notes` | Append-only notes; author rules | FR-4.4; I48 |
| `links` | Token issue/hash/validate/revoke/expire | FR-2.4; FR-3; NFR-5 |
| `sla` | Default N, per-job override, deadline calc, department-default bulk prompt | FR-5; I33/I43 |
| `notifications` | Settings toggles; customer SMS enable+template; in-app write; email/WhatsApp/SMS adapters; actor warnings | FR-7.3–7.4; I18; M19; NFR-1; NFR-8; RC-001 |
| `scheduler` | Colombo cron: at-risk daily; auto weekly report | FR-5.2; FR-6.3 |
| `reports` | Metric engine; auto fan-out; manual bounds; latest artifact per requester | FR-6.3; B9; I46–I47 |
| `audit` | Append-only required events; Admin full / DH dept scope | FR-6.2; I17; I45 |

Cross-module calls go **service → service** (no repository sharing across features). Shared primitives only after rule-of-three (e.g. Colombo date helpers once used in sla + reports + scheduler).

### Frontend surfaces (Next.js)

- **Staff app** (authenticated): intake (show inquiry number), inquiry/job boards, customer/sites, technician directory (role-gated), assignment UX + copyable fallback, lifecycle actions + reopen/SLA prompts, notes, audit views, notification inbox, report UI, admin (users/taxonomy/notification settings including customer SMS toggle+template/SLA defaults).
- **Technician link app** (token only): allow-list job view; status + notes forms; invalid/expired dedicated message (M52). The Next.js technician-link UI obtains job data **only** through NestJS token-authenticated endpoints that return the **I27** allow-list DTO — **no** direct DB / RSC / data bypass.

UI enforces nothing security-critical; NestJS Authorization is source of truth (**NFR-4**).

### UI foundation (look & feel)

**ADR-009.** Code is the design system (no Figma required for MVP consistency):

- **Tailwind CSS** + **shadcn/ui** in `apps/web` (components copied into `components/ui`, not a black-box npm design kit).
- **Tokens:** one theme (CSS variables / Tailwind) for color, type, spacing, radius, focus — shared by staff and technician-link routes.
- **UI contracts** (UI/UX Agent) own screens/flows/roles/states; they do **not** invent per-feature visual languages.
- **Builder** implements screens with shared `ui/` primitives; no one-off button/input styles when a shared component exists.
- **Rule-of-three** for new shared components. Theme polish later adjusts tokens, not feature forks.

### Domain / data model (logical)

Persistence details are implementation; concepts map 1:1 to baseline Data behavior.

```text
StaffUser ──role──► { FRONT_DESK | COORDINATOR | DEPARTMENT_HEAD | ADMIN }
    │
    └── (if DH) exactly one Department

Department ──has──► CategoryLeaf* (active flag; deactivate blocked if any Job refs)
Department.defaultSlaDays: int ≥ 1 (default 10)

Customer (duplicates allowed; no unique business key)
  - name
  - phone
  - primaryAddress
  - email (optional)
  └── CustomerSite* (label + address; delete Admin-only when unreferenced)

Inquiry ──customer──► Customer
  - inquiryNumber (unique; `YYYYMMDD-NNN` Asia/Colombo; ADR-008)
  └── Job* (1..n on create; ≤1 per leaf per inquiry; atomic create)

InquiryNumberCounter (Colombo date → lastSeq) — allocate inside create transaction (ADR-008)

Job
  - categoryLeaf → derived department
  - site, issue, priority (Low|Normal|High|Urgent; default Normal)
  - status: New|Assigned|InProgress|OnHold|Resolved|Cancelled|Closed
  - technician?  deadlineAt (Asia/Colombo EOD)  perJobOverride?
  - cancelReason?  everBeenInProgress (for Resolved gate)
  - NO hard-delete in MVP

JobNote (append-only; author Tech|DH|Admin)
JobShareLink (token hash, issuedAt, expiresAt=issued+10d, revokedAt?, isCurrent)
Technician (phone required; primaryDepartment; active)
NotificationSetting (eventType → inApp/email booleans)
InAppNotification (per staff user)
AuditEntry (append-only; required event types)
JobTimelineEvent (append-only operational events for reports/SLA intervals)
ManualReportArtifact (one retained row/blob per requester)
```

**JobTimelineEvent** (internal, not a business invention): records Assigned, status transitions, On Hold enter/exit timestamps, Reopen, Close, Cancel, Created — so reports can compute On Hold duration, TTR cycles, volume events without parsing free-text audit. Audit entries remain the human-readable compliance view for I17.

**Deletion policy:** Customers/inquiries/jobs never deleted; technicians/taxonomy/sites use deactivate or guarded delete (**I25**, **B5**, **B7**).

### Status & assignment machine (service-owned)

Enforced only in `lifecycle` / `assignment` services:

| Transition / action | Who | Guards |
|---------------------|-----|--------|
| Create → New | System | FR-1.4 |
| New → Assigned | Select technician | First select only; WhatsApp after commit (see Notification / WhatsApp) |
| Reassign / regenerate | DH/Admin | Keep existing status; Closed/Cancelled rejected until Reopen |
| Tech: → In Progress / On Hold / Resolved | Valid link | Resolved requires ever In Progress; On Hold note required (trim) |
| DH/Admin: In Progress / On Hold / Resolved | Staff + tech present | On Hold note optional |
| Close | DH/Admin dedicated | **Current** status Resolved (B8) |
| Cancel | DH/Admin dedicated | Reason non-empty after trim |
| Edit cancel reason | DH/Admin | Non-empty after trim; **I57 deferred** for post-Reopen |
| Reopen | DH/Admin | Deadline prompt keep/restart/custom; → Assigned if tech else New |
| Free-jump New/Assigned/Cancelled/Closed | — | Rejected |
| Select/reassign on Closed/Cancelled | — | Rejected until Reopen |
| FD edit issue/site/priority/category | Front desk | Allowed **only until** a technician is selected on that job (**FR-8**) |
| DH/Admin edit issue/site/priority/category | DH/Admin | After technician selection: allowed **while job is open**; Closed/Cancelled require **Reopen** first (**M14**) |
| Reclassify leaf category | DH/Admin | Per approved requirements (**FR-4.3**): department re-derived; dual-DH notify (once if same DH); technician/status kept |

Last-write-wins concurrency (**NFR-6**): no optimistic locks required in MVP.

### Notification architecture

```text
Domain service
  → commit business write first (inquiry+jobs+inquiryNumber; or assignment+link; etc.)
  → after commit / outside the business transaction:
       NotificationOrchestrator.enqueueOrSend(event)
         → resolve recipients (fixed by role rules — not configurable)
         → read NotificationSetting for staff event types; or customer SMS settings for CUSTOMER_INQUIRY_CREATED
         → InAppChannel (best-effort write; no failure UX — M19)
         → EmailChannel (action-triggered: on fail, return warning to actor — I18;
                         scheduled: best-effort)
         → WhatsAppChannel (assignment/regenerate only; after commit;
                           WhatsApp failure must not roll back assignment;
                           on fail → copyableText fallback — I52)
         → SmsChannel (CUSTOMER_INQUIRY_CREATED only; after inquiry commit;
                       SMS failure must not roll back create; actor warning — RC-001 / I58)
```

**Assignment transaction boundary:** assignment/link persistence **commits first**. WhatsApp is sent **after commit / outside the business transaction**. WhatsApp failure **must not** roll back the assignment; `copyableText` remains the fallback (**I52**).

**Inquiry create transaction boundary:** inquiry + jobs + `inquiryNumber` (via `InquiryNumberCounter`) **commit first**. Optional customer SMS is sent **after commit**. SMS failure **must not** roll back the create; actor gets in-app warning (**FR-1.9** / ADR-008).

**Event types (MVP):** `JOB_CREATED`, `JOB_DEPT_CHANGED` (old+new DH, dedupe if same — M32), `JOB_AT_RISK`, `CUSTOMER_INQUIRY_CREATED` (SMS when Admin enabled — FR-7.4), plus report emails as report-module sends (not staff “event toggle” unless Admin settings cover them — **settings apply to staff in-app/email event types per FR-7.3**; weekly report is a required delivery channel under NFR-1 — treat report email as always-on operational mail unless a later requirements change adds a toggle). Customer SMS enable + template are separate Admin settings (default off).

**Recipients fixed:**

- New job / dept change: owning DH(s)
- At-risk: owning DH + all Admin-role users
- Auto weekly: all Admins (all-dept); each DH (own dept)
- Manual weekly: requester only
- Customer inquiry SMS: customer phone on the inquiry (one message per inquiry)

**Trace:** Confirmed Notifications; FR-1.5; FR-1.7–1.9; FR-5.2; FR-6.3; FR-7.3–7.4; I18; M19; NFR-1; NFR-8; RC-001 / I58; ADR-008.

### WhatsApp integration

- Interface: `WhatsAppSender.send({ toE164OrRawPhone, body }) → { ok } | { ok:false, error }`.
- Body builder (shared with copyable fallback): `link + customer name + site label + issue(truncated) + priority` (**I42/I52**). Truncation length = provider/channel limit (Assumption 10 / M44 storage separate).
- Sent only after assignment/link commit (outside the business transaction). On failure: API response includes `copyableText` identical to intended WhatsApp body; assignment/status remain committed (no rollback).
- Phone suitability validation (**M45**) **deferred** — do not invent format rules; store phone as entered; document dependency “suitable for WhatsApp.”
- Provider stays behind the `WhatsAppSender` adapter; no business logic in SDK calls. Production credentials/provider configuration can be introduced later without changing assignment/notification business logic.
- **Development tier (architectural decision — ADR candidate):** Meta WhatsApp Cloud API Developer Sandbox / Test Number. Temporary development access tokens; recipients restricted to pre-verified developer/tester personal numbers within Meta’s applicable platform limits. No Meta Business Verification or production app review during the current development phase. Production/general-user messaging requires production credentials, verification, and applicable template/compliance requirements (see External services).

### SMS integration (customer inquiry acknowledgement)

- Interface: `SmsSender.send({ toPhone, body }) → { ok } | { ok:false, error }` (ADR-008).
- Body: Admin template with `{INQUIRY_NUMBER}` and `{JOB_COUNT}` substituted; English only in MVP.
- Sent only after inquiry create commit, and only when Admin `customerSmsEnabled` is true (default false). On failure: actor in-app warning; inquiry/jobs remain committed.
- Phone suitability validation (**M45**) **deferred** — same stance as WhatsApp; store phone as entered.
- **Dev/CI:** fake / log-only `SmsSender`. **Prod:** env-configured gateway (Twilio / Vonage / local SMS aggregator) behind the same interface.
- No manual resend in MVP.

### Email integration

- Interface remains the existing email adapter/channel behind `NotificationOrchestrator` (action-triggered warning vs scheduled best-effort unchanged — **I18** / **M19**).
- **Development tier (architectural decision — ADR candidate):**
  - **Local:** Mailtrap Fake SMTP Server via environment variables so outbound email is inspected (HTML, headers, delivery behavior) without sending to real recipients.
  - **Staging / early live-delivery checks:** Resend developer/free tier where live delivery verification is required.
- Provider credentials are environment-specific and must never be committed to source control. Production transactional email (SES / Postmark / Resend / SendGrid, etc.) remains an env-configured swap behind the same adapter — no new architecture pattern.

### Development-tier external integrations (summary)

| Channel | Development choice | Adapter boundary | Limitation |
|---------|--------------------|------------------|------------|
| WhatsApp | Meta Cloud API sandbox / test number; temp access tokens; pre-verified tester recipients only | `WhatsAppSender` | No general-user messaging until production credentials + verification/templates |
| Email (local) | Mailtrap Fake SMTP | Existing email adapter | Not real-recipient delivery |
| Email (staging / live checks) | Resend developer/free tier | Existing email adapter | Subject to provider free-tier quotas/policies |

**Consequences — positive:** no additional paid integration cost during development (subject to current free/developer-tier limits); avoids accidental messaging/email to real users in local development; avoids premature production compliance/verification work.

**Consequences — negative / limitations:** WhatsApp testing restricted to permitted developer/tester numbers; production WhatsApp needs production credentials and applicable verification/template requirements; development-tier quotas and provider policies may change and must be verified before production.

This is an **environment/provider-configuration decision** only. It does not change frozen business requirements, notification event types/recipients, or the adapter architecture.

### Shareable-link security

- Generate ≥128-bit cryptographically random token; persist **hash only** (e.g. SHA-256); URL carries raw token once.
- Validity: current link AND not revoked AND `now < issuedAt + 10 days` AND job status ∉ {Closed, Cancelled} (**NFR-5**, FR-2.4).
- Reassign / same-tech regenerate / explicit regenerate: revoke previous current link; issue new; attempt WhatsApp.
- Invalid/expired UX: fixed intent message (**M52**); no job payload.
- Technician API: authenticate solely by token; responses projected through allow-list DTO (**I27**): hide primary address, email, cancel reason, audit.
- Next.js `/t/[token]` UI obtains job data **only** via those NestJS token-authenticated endpoints (I27 DTO). **No** direct DB, Prisma, or RSC data bypass.
- Residual risk (forwarded links, phone on page) acknowledged in baseline Risks — mitigate with expiry + revoke only; no extra product controls invented.

### SLA / background processing

- Timezone: **Asia/Colombo** exclusively for calendar deadlines, at-risk window, report periods (**NFR-3**).
- Deadline: create calendar date + N days, due through 23:59:59 Colombo that day (**I4**).
- At-risk eligibility: open (not Closed/Cancelled) and calendar date ≥ deadlineDate − 2 days; notify **only** via daily 08:00 job — **no** immediate at-risk on reopen/into-window (**M28**).
- Department default change: prompt flag `updateOpenJobsWithoutOverride`; recalculate those from create + new N; leave per-job overrides (**I6/I26**).
- Per-job override / reopen custom: deadline date ≥ today Colombo (**I28/I33**).
- Scheduler: NestJS cron with explicit `Asia/Colombo` timezone (single instance assumption for MVP — document multi-instance lock need if horizontally scaled later; **ponytail:** global single-scheduler assumption; upgrade = distributed lock / external scheduler).

### Reporting

- **Engine** in `reports` service: pure functions over Job + JobTimelineEvent + Technician snapshots.
- **Auto:** previous Mon–Sun Colombo; Monday 08:00; email-only; all-or-nothing (**I30**); fan-out Admin all / DH own.
- **Manual:** inclusive start/end; end ≤ today; span ≤ 90; start=end OK; email requester; retain **latest** artifact per requester in-app (**I36**, **I46–I47**); email fail → warning + artifact kept (**I24**).
- Metrics per Confirmed behavior (volume events, aging, workload incl. techs with 0, quality/flow, Cancelled excluded from performance outcomes).
- **TTR (I49):** include on auto + manual. **I54 DEFERRED** — architecture stores/first-class computes:
  - first Assigned → first Resolved interval
  - latest Assigned → following Resolved after reopen  
  …as raw cycle data. **Do not lock** avg/median vs per-job-only vs unit (calendar vs elapsed) until requirements change for I54. Report DTO leaves an explicit `timeToResolve: TBD_PENDING_I54` extension point; implementation must not invent the aggregate shape.

### Audit logging

Append-only `AuditEntry` with actor, timestamp, action, entity refs, departmentId for DH scoping.

**Must include (I17):** status changes; technician select/reassign; Cancel/Reopen (+ reasons); reclassify; SLA overrides (incl. bulk default update); inquiry/job create; customer create/edit; site create/edit/delete attempts; technician directory changes; staff user/role changes.

**Must not require:** notification setting changes; taxonomy changes; note add (**I45**).

**I55 DEFERRED:** whether cancel-reason *edits* are audited — do not silently include or exclude as a product decision; leave as open checklist item before hardening audit acceptance tests for M41.

**Retention (M18):** deferred — no TTL job in MVP.

### Authorization (server-side)

Enforce via NestJS guards + policy helpers in services (defense in depth for DH department scoping).

| Rule | Implementation note | Trace |
|------|---------------------|-------|
| Exactly one staff role | DB constraint / single `role` enum column | I50 |
| Admin ≠ DH | Reject dual; mutual exclusive | I44 |
| Exactly one DH per dept | Unique partial index on (departmentId) where role=DH & active; one-step replacement = single transaction swap | I34/I38 |
| DH job R/W own dept only; sibling indicator only | Query filter + inquiry DTO `otherDepartmentJobCount` or existence flag (**M43** shape deferred — either OK) | I51 |
| FD: view all; create inquiries/jobs/customers/sites; edit customer anytime; edit unassigned-job fields until tech select | Capability matrix | Auth table; FR-1; FR-8 |
| FD: **cannot** select technicians | Deny select/reassign/regenerate | Auth table; FR-2.1 |
| FD: no notes, no Close/Cancel/Reopen, no tech manage, directory RO | Capability matrix | Auth table; M5 |
| Coordinator: read-all jobs only | View inquiries/jobs across departments | Auth table; M5 |
| Coordinator: **cannot** create customers, inquiries, or sites | Deny create/mutate intake | Auth table; FR-1.1 |
| Coordinator: deny directory/audit/reports/admin/taxonomy/notification settings/tech manage/select/notes/Close/Cancel/Reopen | Capability denylist | Auth table; M5 |
| Tech: token scope single job | links module; I27 allow-list DTO only | FR-3 |
| Go-live seed: three DHs | Ops/seed checklist | M35 |

**I56 DEFERRED:** whether DH may change technician primary department (when no open jobs) vs Admin-only — **do not implement authz for that mutation until decided**; Admin path exists for directory management generally — flag before builder implements primary-dept change for DH.

### Deployment / infrastructure

Minimal justified footprint:

| Component | Choice | Why |
|-----------|--------|-----|
| API + worker | One NestJS service | Modular monolith; cron in-process |
| UI | One Next.js app | Staff + public tech routes |
| DB | Managed PostgreSQL | Prisma/stack authority |
| Secrets | Env / host secret store | Tokens, WhatsApp, SMS, SMTP/email provider; env-specific; never commit credentials |
| CI/CD | GitHub Flow | README |
| File/blob for manual reports | DB bytea or object storage | Prefer DB for “latest one per user” MVP size; object storage only if payload size forces it |

No Redis/queue/search cluster in MVP unless proven necessary.

### External services and cost-impacting dependencies

| Dependency | Required by | Cost nature | Notes |
|------------|-------------|-------------|-------|
| **WhatsApp** (Meta Cloud API) | FR-2; NFR-1; technician delivery | **Dev:** free sandbox / test number (Meta developer limits). **Prod:** recurring per-message (+ possible monthly number fee); BSP e.g. Twilio remains an optional production swap behind the same adapter | Mandatory channel; behind `WhatsAppSender`. **Dev:** Developer Sandbox / Test Number, temporary access tokens, pre-verified tester recipients only; no Business Verification or production app review in current development phase. **Prod:** production credentials + applicable verification/template/compliance. Copyable fallback mitigates failure but not cost of successful production sends |
| **SMS** (customer inquiry ack) | FR-1.8–1.9; FR-7.4; NFR-8; RC-001 | **Dev/CI:** fake/log-only. **Prod:** recurring per-SMS (+ possible platform fee); Twilio / Vonage / local aggregator behind `SmsSender` | Optional until Admin enables; one SMS per inquiry create when on. Failure → actor warning; create kept |
| **Transactional email** | Staff notify; weekly reports; NFR-1 | **Dev local:** Mailtrap Fake SMTP (no real recipients). **Staging / live checks:** Resend developer/free tier. **Prod:** recurring per-email (SES / Postmark / Resend / SendGrid, etc.) | Behind existing email adapter; credentials env-specific, never committed. Action + scheduled volume (at-risk can fan out DH+all Admins daily) |
| **Managed PostgreSQL** | All persistence | **Recurring** | |
| **App hosting** (API + Next.js compute) | Runtime | **Recurring** | Single region near users preferred; Colombo TZ is logical not host TZ |
| Staff identity | Login | Prefer **first-party** email/password (or magic link) in `identity` module | Avoids Clerk/Auth0 **seat subscription** unless ops later requires SSO (not in baseline) |

**Not introduced:** customer-facing CDN beyond normal static hosting, Elasticsearch, Kafka, serverless fan-out, paid observability suites (optional later; NFR-7 unspecified). SMS is introduced only as the `SmsSender` adapter for RC-001 (ADR-008) — no separate SMS microservice.

**NFR-1 / M42 intentionally open:** retry/backoff for email/WhatsApp/SMS beyond WhatsApp→copyable and SMS→actor-warning is an **implementation constraint**, not a silent product SLA. Architecture: adapters may retry transient failures internally with short bounded attempts; no user-visible multi-retry product; document chosen bound in adapter config without claiming business durability guarantees.

---

## Files / components (proposed layout)

Greenfield target shape (not created in this phase):

```text
apps/web/                          # Next.js App Router
  app/(staff)/...
  app/t/[token]/...               # technician link
  components/ui/                   # shadcn primitives + shared wrappers (ADR-009)
  app/globals.css                  # Tailwind + theme tokens (ADR-009)
apps/api/                          # NestJS
  src/identity|taxonomy|customers|jobs|technicians|
      assignment|lifecycle|notes|links|sla|
      notifications|scheduler|reports|audit/
    *.controller.ts
    *.service.ts
    *.repository.ts
    *.policies.ts
  prisma/schema.prisma
  prisma/seed.ts                   # 3 depts + leaves + 3 DH go-live
packages/ (only if rule-of-three demands shared types)
```

---

## Data changes

New schema covering entities above. Material indexes:

- Job by department + status + deadline (at-risk, boards)
- Job by technicianId where open (deactivate / workload)
- Inquiry by customer; Customer search by name/phone (trigram or ILIKE — implementation)
- Unique current share link per job; token hash unique
- Partial unique: one active DH per department
- Audit by departmentId + time; ManualReportArtifact unique per requesterUserId

Migrations: initial only for MVP greenfield.

**Storage caps:** issue max length (**M44**) deferred as business rule — apply a defensive DB/text limit only as infra safety and document it as non-business until requirements set a cap.

---

## API changes

Baseline: **no API contracts in requirements** (“API behavior: Not specified”). Architecture defines **internal** NestJS HTTP API for the Next.js app (not a public partner API — out of scope as deliverable).

Illustrative resource groups (contracts locked at specification/builder time, not here as product):

- `POST /inquiries` atomic multi-job
- Job lifecycle/assignment/notes/SLA endpoints with role guards
- `GET /t/:token` + PATCH status/notes (public)
- Reports manual generate + latest download
- Admin users/taxonomy/settings

No external API product.

---

## Authorization

See matrix in Proposed design. Summary: NestJS guards + service policies; technician token auth separate from staff session; DH row-level department filter; Admin full; FD/Coordinator capability denylist as baseline Auth table (including **FD cannot select technicians**; **Coordinator cannot create customers, inquiries, or sites**).

---

## Testing

Per Assidua + baseline Test requirements (acceptance criteria authoritative):

- **Feature-owned** unit/integration tests on services: status machine, atomic create, SLA dates, report formulas, link validity, role guards, sole-DH replacement.
- **Playwright** completed flows: multi-dept inquiry DH view+indicator → assign → WhatsApp/copyable parity → status → Close; cancel+edit reason; notes add-only; manual report bounds + TTR placeholder; single role; tech primary-dept block; sole/dual DH; invalid link message.
- Audit assertions for required events (exclude notes; **I55** pending for cancel-reason edit).
- Adapter tests with fakes for Email/WhatsApp (no live provider in CI).

---

## Migration impact

Greenfield — initial schema + seed (taxonomy tree; three departments; require three DH users before production — M35). No legacy data migration.

---

## Risks

| Risk | Mitigation |
|------|------------|
| WhatsApp cost + delivery failure | Dev-tier sandbox/tester-only (no paid prod messaging yet); adapter + copyable fallback; monitor send fail rate in production |
| Accidental real-user email/WhatsApp in local/dev | Mailtrap for local email; WhatsApp restricted to pre-verified tester numbers; env-specific credentials |
| Dev-tier quota / provider policy change before prod | Verify Meta/Resend/Mailtrap limits before production cutover; swap credentials behind existing adapters |
| Shareable link leakage | Hash-at-rest, 10-day expiry, revoke on reassign/Close/Cancel |
| Duplicate customers | UX search disambiguation only (allowed by reqs) |
| At-risk email fatigue | As specified; no extra throttling invented |
| Taxonomy permanence | Accepted (M17); communicate to ops |
| Single-process cron duplicate under multi-instance | Document single-instance MVP; lock later |
| Deferred I54/I55/I56/I57 blocking slices | Explicit gates below — do not invent |
| Alert/report email cost at Admin fan-out | Expected recurring cost; keep recipient rules fixed |

---

## Alternatives

| Topic | Rejected / deferred alternative | Why not |
|-------|----------------------------------|---------|
| Microservices for notify/report | Separate workers/services | Violates modular monolith; YAGNI |
| Technician authenticated app | Mobile login | Out of scope MVP |
| Queue product (SQS/Rabbit) | In-process + DB | MVP volume; add when needed |
| Third-party Auth (Clerk/Auth0) | First-party staff accounts | Recurring seats not justified by baseline |
| Storing raw share tokens | Hash only | Security (NFR-5) |
| Soft “Reopened” status | Action → Assigned/New | Decision 9/25 |
| Immediate at-risk on reopen | Daily 08:00 only | M28 |
| Building multi-week report archive | Latest manual only; auto email-only | I36 |
| Production Meta verification / paid WhatsApp during development | Dev sandbox + tester numbers only | Avoids premature compliance cost; adapter unchanged for later prod swap |
| Real SMTP / production email from local machines | Mailtrap Fake SMTP locally; Resend free tier for staging live checks | Prevents accidental real-recipient delivery; same email adapter |

---

## Deferred requirements (explicit — not decided)

Architecture **must not** treat parking as product decisions. Escalate as requirements change if a build step needs a pick:

| ID | Topic | Architecture stance until decided |
|----|-------|-----------------------------------|
| **I54** | TTR report shape / population / unit | Persist raw cycles; **block** final report aggregate UX/DTO |
| **I55** | Audit cancel-reason edits | **Block** audit AC for M41 edit events |
| **I56** | DH vs Admin-only tech primary-dept change | **Block** DH authorization on that mutation |
| **I57** | Cancel-reason edit after Reopen | **Block** status guard on edit endpoint |
| **M43** | Sibling indicator count vs existence | Either acceptable; UI may pick existence string without new req |
| **M44** | Issue business max length | Defensive infra limit only; label as non-business |
| **M45** | Phone/WhatsApp validation | No invent; dependency note only |
| **M47** | UX callout for snapshot-at-generation | UX copy in spec phase; not a metric rule |
| **NFR-1/M42** | Email/WhatsApp retry policy | Adapter-level bounded retry OK; no business SLA claim |

**Optional same-sprint clarifications** (from Session 6): I54, I56 — request before report UI and technician primary-dept DH path are built.

---

## Decision

Adopt a **single modular monolith**: Next.js + NestJS + PostgreSQL/Prisma, feature modules as listed, Colombo-scheduled in-process jobs, hashed shareable links, WhatsApp+email+in-app+SMS notification adapters, append-only audit + timeline events for metrics, first-party staff auth, minimal external paid deps (WhatsApp, email, SMS, hosting, DB).

**UI foundation (ADR-009):** Tailwind CSS + shadcn/ui; code is the design system; UI contracts own interaction only.

**Architectural decision (ADR candidate — not authored here): Development-tier external integrations.** During the current development phase, WhatsApp uses Meta Cloud API Developer Sandbox / Test Number (temporary tokens; pre-verified tester recipients only; no Business Verification or production app review). Local email uses Mailtrap Fake SMTP; staging/early live-delivery checks may use Resend’s developer/free tier. Both channels remain behind the existing `WhatsAppSender` and email adapters with environment-specific credentials (never committed). This is an environment/configuration decision only — frozen business requirements and notification adapter architecture are unchanged. Production messaging still requires production credentials and applicable verification/compliance; development-tier quotas/policies must be verified before production.

All behavior traced to frozen baseline; deferred IDs left open; no business invention; no implementation planning in this artifact.

---

## Human approval

**Approved (2026-08-12).** Architecture may proceed to specification / implementation planning. Confirmed:

1. Stack & monolith boundaries (Next.js + NestJS + Postgres; in-process cron).
2. External deps: WhatsApp (Meta Cloud API) + transactional email + managed DB/hosting; first-party auth (no IdP subscription). **Development tier:** Meta sandbox/test number + Mailtrap (local) / Resend free tier (staging live checks); production credentials/verification deferred until production cutover; adapters unchanged.
3. Module split and notification/link/SLA/report approach.
4. Explicit gates on **I54, I55, I56, I57** (and awareness of M43–M47 / NFR-1).
5. Sibling indicator: OK to ship existence-or-count per M43 without further decision.
6. **UI foundation (ADR-009, 2026-08-13):** Tailwind + shadcn/ui; code-first design system; no Figma required for MVP consistency.

**Stop point:** Architecture design approved. No production code in this artifact. Implementation planning may proceed subject to gates on deferred items. Development-tier integrations decision remains an ADR candidate (ADR file not authored in architecture phase).
