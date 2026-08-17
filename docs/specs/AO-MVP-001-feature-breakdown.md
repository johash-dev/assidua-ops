# AO-MVP-001 — Feature specification breakdown

**Parent Feature ID:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN 2026-08-11 + RC-001 / I58 HUMAN APPROVED 2026-08-13); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED 2026-08-12; RC-001 amend HUMAN CONFIRMED 2026-08-13); ADRs 001–008  
**Status:** SPECIFY COMPLETE — AO-F-001…012 HUMAN APPROVED (2026-08-12); **RC-001 amend on F-005 / F-009 HUMAN CONFIRMED** (2026-08-13); **AO-ENG-000 COMPLETE** (2026-08-13)  
**Purpose:** Split the MVP into ordered, shippable feature contracts for SPECIFY → PLAN → IMPLEMENT. Does not invent business rules.

---

## Rules

1. One feature spec = one independently verifiable capability with observable acceptance criteria.
2. Do not start the next feature’s implementation until the current slice’s applicable AC / tests pass (`vertical-slice-implementation`).
3. Deferred IDs **I54–I57** remain gates — specs that need them stay blocked or explicitly out of scope until a requirements change.
4. API shapes are locked in each feature spec (baseline left API unspecified; architecture allows internal NestJS contracts at specification time).
5. **AO-ENG-000** is engineering foundation, not a business feature contract.

---

## Delivery order

| Order | ID | Title | Depends on | Deferred gates | Spec status |
|------:|----|-------|------------|----------------|-------------|
| 0 | AO-ENG-000 | Platform foundation (Next.js + NestJS + Prisma + CI skeleton) | — | — | **COMPLETE** (2026-08-13) |
| 1 | AO-F-001 | Department & category taxonomy | AO-ENG-000 | — | **IMPLEMENT complete; independent review passed (2026-08-18)** |
| 2 | AO-F-002 | Staff identity (login/session + Admin user/role management + sole-DH rules) | AO-F-001 (Department exists for DH) | — | **IMPLEMENT complete (2026-08-18); awaiting review** |
| 3 | AO-F-003 | Customers & sites | AO-F-002 | — | **HUMAN APPROVED (2026-08-12)** |
| 4 | AO-F-004 | Technician directory | AO-F-001, AO-F-002 | **I56** blocks DH primary-dept-change authz | **HUMAN APPROVED (2026-08-12)** |
| 5 | AO-F-005 | Inquiry & job intake (atomic multi-job create + inquiry number + FD/DH/Admin edit rules pre-assignment) | AO-F-001–004 | — | **HUMAN APPROVED (2026-08-12); RC-001 amend CONFIRMED (2026-08-13)** |
| 6 | AO-F-006 | Assignment & hashed shareable links (+ WhatsApp/copyable) | AO-F-004, AO-F-005 | — | **HUMAN APPROVED (2026-08-12)** |
| 7 | AO-F-007 | Job lifecycle & notes (status/Close/Cancel/Reopen + add-only notes + tech link mutations) | AO-F-006 | **I57** blocks cancel-reason edit after Reopen | **HUMAN APPROVED (2026-08-12)** |
| 8 | AO-F-008 | SLA defaults, per-job override, deadline calc | AO-F-005 | — | **HUMAN APPROVED (2026-08-12)** |
| 9 | AO-F-009 | Notifications (settings + in-app/email/SMS adapters + customer SMS template + actor warnings) | AO-F-002; consumers of F-005–008 | NFR-1/M42 adapter retry only | **HUMAN APPROVED (2026-08-12); RC-001 amend CONFIRMED (2026-08-13)** |
| 10 | AO-F-010 | Scheduler (Colombo: daily at-risk + weekly auto report trigger) | AO-F-008, AO-F-009; reports engine for weekly | — | **HUMAN APPROVED (2026-08-12)** |
| 11 | AO-F-011 | Performance reports (manual + auto fan-out) | AO-F-002, timeline events from jobs/lifecycle | **I54** blocks final TTR aggregate UX/DTO | **HUMAN APPROVED (2026-08-12)** |
| 12 | AO-F-012 | Audit log views (Admin full / DH dept) | Writes from earlier features | **I55** blocks cancel-reason-*edit* audit AC | **HUMAN APPROVED (2026-08-12)** |

Cross-cutting writes (audit entries, timeline events, notifications) are **emitted by owning feature services** when those events occur; **view/config UIs** land in F-009 / F-011 / F-012.

---

## Module → feature map

| Architecture module | Primary feature |
|---------------------|-----------------|
| `taxonomy` | AO-F-001 |
| `identity` | AO-F-002 |
| `customers` | AO-F-003 |
| `technicians` | AO-F-004 |
| `jobs` | AO-F-005 |
| `assignment` + `links` | AO-F-006 |
| `lifecycle` + `notes` | AO-F-007 |
| `sla` | AO-F-008 |
| `notifications` | AO-F-009 |
| `scheduler` | AO-F-010 |
| `reports` | AO-F-011 |
| `audit` | AO-F-012 (persistence helpers may land earlier) |

---

## Explicit non-goals of this breakdown

- No production code.
- No implementation plan step lists (that is PLAN per approved spec).
- No resolution of I54–I57 / M43–M47.
- No merge of AO-MVP-001 into a single mega-spec.

---

## Human approval checklist

- [x] Accept ordered Feature IDs AO-F-001 … AO-F-012 (+ AO-ENG-000).
- [x] Accept Taxonomy before Identity (DH needs Department) — implied by AO-F-001 approval / order in use.
- [x] Accept deferred-gate placement (I54→F-011, I55→F-012, I56→F-004, I57→F-007).
- [x] **AO-F-001** approved (2026-08-12).
- [x] **AO-F-002** approved (2026-08-12) — email/password; env seed; last-Admin guard.
- [x] **AO-F-003** approved (2026-08-12).
- [x] **AO-F-004** approved (2026-08-12) — I56 = Admin-only primary-dept change.
- [x] **AO-F-005** approved (2026-08-12) — deadline on create; M43 → PLAN; **RC-001 amend CONFIRMED (2026-08-13)**.
- [x] **AO-F-006** approved (2026-08-12) — tech read here; status/notes → F-007.
- [x] **AO-F-007** approved (2026-08-12) — I57 = cancel-reason edit only while Cancelled.
- [x] **AO-F-008** approved (2026-08-12) — required bulk flag; no reclassify auto-recalc; no clear-override.
- [x] **AO-F-009** approved (2026-08-12) — always-on report email; no settings audit; NFR-1 adapter-only; **RC-001 amend CONFIRMED (2026-08-13)**.
- [x] **AO-F-010** approved (2026-08-12) — schedule-only at-risk; single-instance ponytail; weekly triggers F-011.
- [x] **AO-F-011** approved (2026-08-12) — I54 = raw TTR cycles + TBD placeholder only.
- [x] **AO-F-012** approved (2026-08-12) — I55 = no cancel-reason-edit emit/AC; M18 no TTL.

---

## Next exact step

1. Independent **REVIEW** of AO-F-002 (then security check).
2. DESIGN (if needed) then PLAN for **AO-F-003** (customers & sites).
