# AO-F-003 — Customers & sites

**Feature ID:** AO-F-003  
**Parent:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED)  
**Breakdown:** `docs/specs/AO-MVP-001-feature-breakdown.md`  
**Depends on:** AO-F-002 (staff session + roles)  
**Status:** HUMAN APPROVED (2026-08-12)  
**Module:** `customers`

---

## Objective

Let Front Desk, Admin, and Department Heads search/create/edit customers and manage customer sites so job intake can attach a shared customer and a site-based service location (FR-1.1, FR-1.2, B7).

---

## Business context

Customers are shared across departments; duplicates are allowed (no unique business key). Job location must be a site, not the customer primary address unless that address is also saved as a site. Customers are never deleted in MVP (I25). Site delete is Admin-only when unreferenced (B7).

---

## User story

As Front Desk (or Admin/DH), I find or create a customer by name/phone, maintain their contact fields, and manage labeled sites so later inquiry/job create can pick a service location.

---

## Functional requirements

- FR-C1: Create customer with required **name**, **phone**, **primary contact address**; **email optional** (FR-1.1).
- FR-C2: Search/select existing customers by **name** and/or **phone**; **duplicates allowed** — staff must choose the correct record (FR-1.1).
- FR-C3: Front Desk, Admin, and DH may **edit** customer name/phone/email/primary address anytime (baseline AC).
- FR-C4: **Coordinators cannot create** customers (FR-1.1). Coordinators also cannot create/edit/delete sites (Auth table; create inquiry/sites = No).
- FR-C5: Front Desk, Admin, and DH may **create/edit** sites for a customer; each site requires **label/name** and **address**. **DH may create/edit sites for any customer** (M27 / I11).
- FR-C6: Editing a site updates label/address for all jobs that reference it (including past jobs) (I11).
- FR-C7: Delete site is **blocked** while any job references it. When unreferenced, **only Admin** may delete; FD and DH delete attempts are rejected (B7).
- FR-C8: **No deletion** of customers in MVP (I25).
- FR-C9: Phone format / WhatsApp suitability validation is **deferred (M45)** — store phone as entered; do not invent format rules.
- FR-C10: Customer create/edit and site create/edit/delete attempts must append audit events (I17). Audit **view** is AO-F-012.

---

## Non-functional requirements

- NFR-4: NestJS enforces role checks; UI not trusted.
- NFR-6: Concurrent edits last-write-wins (MVP).
- Repository-only DB access; rules in `customers` service.

---

## Acceptance criteria

### Customer create / search / edit

- Given Front Desk, Admin, or DH, when they create a customer with name, phone, and primary address (email optional), then the customer is persisted and searchable.
- Given required customer fields missing or whitespace-only name/phone/primary address, when save is attempted, then create/edit is rejected.
- Given duplicate name/phone already exists, when staff creates another customer with the same values, then create **succeeds** (duplicates allowed).
- Given customers in the system, when staff searches by name or phone substring/match (implementation may use contains/prefix — must be documented in PLAN and covered by tests), then matching customers are returned for selection.
- Given FD/DH/Admin, when editing customer phone/email/address/name anytime, then the change is allowed.
- Given Coordinator, when attempting customer create or edit, then the change is rejected.
- Given any role, when attempting to delete a customer, then delete is rejected.

### Sites

- Given FD/Admin/DH, when they create a site with label/name + address on any customer, then the site is persisted and available for job location selection (job wiring in AO-F-005).
- Given a customer with no jobs in the DH’s department, when that DH creates or edits a site for that customer, then the change is allowed.
- Given customer primary address only and no sites, when DH or Admin prepares a job later, then they may add a site (label/name + address) and select it (site create allowed here; job create in F-005).
- Given a site is edited, when saved, then all jobs referencing that site show the updated label/address (when jobs exist).
- Given an unreferenced site, when FD or DH attempts delete, then delete is rejected; when Admin deletes, then delete succeeds.
- Given a site referenced by any job, when any role attempts delete, then delete is rejected.
- Given Coordinator, when attempting site create/edit/delete, then the change is rejected.

### Audit write

- Given staff completes customer create/edit or site create/edit/delete attempt (including rejected delete attempts that must still be auditable per I17 “delete attempts”), when audit storage is queried, then corresponding events exist. **ponytail:** persist attempt outcomes for delete (success and business-rule rejection) so F-012 can show them; do not invent extra audit event types beyond I17 intent.

---

## User-visible behavior

- Staff (FD/Admin/DH): customer search, create, edit; site list/create/edit; Admin-only site delete when unreferenced.
- Coordinator: read-only access to customer/site data as needed when viewing inquiries/jobs later — for this feature, **read** of customers/sites is allowed for all authenticated staff (including Coordinator) so job boards can resolve names; mutations denied as above.
- No customer hard-delete control.

---

## API behavior

| Method | Resource | Authz | Behavior |
|--------|----------|-------|----------|
| GET | `/customers?query=` | Authenticated staff | Search by name/phone; duplicates may all appear |
| GET | `/customers/:id` | Authenticated staff | Customer + sites |
| POST | `/customers` | FD, Admin, DH | Create |
| PATCH | `/customers/:id` | FD, Admin, DH | Edit |
| POST | `/customers/:id/sites` | FD, Admin, DH | Create site |
| PATCH | `/sites/:id` | FD, Admin, DH | Edit site |
| DELETE | `/sites/:id` | Admin only; unreferenced | Delete; else 4xx |

---

## Data behavior

- `Customer`: id, name, phone, primaryAddress, email optional; no unique business key.
- `CustomerSite`: id, customerId, label, address.
- Jobs reference `siteId` (owned by jobs module / F-005); site delete checks for any referencing job.
- Customers never deleted.

---

## Authorization

| Action | Admin | DH | Front desk | Coordinator | Tech link |
|--------|-------|----|------------|-------------|-----------|
| Search/read customers & sites | Yes | Yes | Yes | Yes | No (tech gets allow-list via F-006/F-007) |
| Create/edit customer | Yes | Yes | Yes | No | No |
| Create/edit site (any customer) | Yes | Yes | Yes | No | No |
| Delete unreferenced site | Yes | No | No | No | No |
| Delete customer | No | No | No | No | No |

---

## Error states

- Coordinator (or unauthenticated) mutate customer/site → rejected.
- Missing required customer/site fields → rejected.
- FD/DH delete site → rejected.
- Any role delete referenced site → rejected.
- Customer delete → rejected.
- Tech link calling these staff APIs → rejected.

---

## Edge cases

- Duplicate customers with same phone/name: both remain; search returns both.
- Site edit ripples to historical jobs’ displayed location (same site row).
- Primary address is **not** auto-copied into a site; staff must create a site explicitly.
- Empty search query: return empty list or bounded recent list — **PLAN choice**; must not invent a “merge duplicates” feature.

---

## Dependencies

- AO-F-002 authenticated staff + roles.
- Job rows for site reference checks (when F-005+ exists; until then unreferenced delete always allowed for Admin).
- Audit write helper.

---

## Constraints

- Do not invent phone validation (M45).
- Do not invent customer merge/dedup.
- Do not implement inquiry/job create here (AO-F-005).
- Do not expose customer email/primary address on technician link (enforced in F-006/F-007 allow-list, not by deleting fields here).

---

## Out of scope

- Inquiry/job intake and job↔site binding UI beyond site CRUD
- Customer portal
- Soft-delete/archive of customers
- Phone/WhatsApp suitability validation product rules
- Audit viewer UI (F-012)

---

## Test requirements

- Unit/service: required fields; duplicates allowed; Coordinator denied; site delete guards; customer delete denied.
- Integration: authz matrix HTTP.
- Playwright: FD creates customer + site; Admin deletes unreferenced site; FD cannot delete site; Coordinator cannot create customer.

---

## Definition of Done

- [ ] Spec human-approved.
- [ ] PLAN + implementation meet AC.
- [ ] Feature-owned tests + applicable E2E green.
- [ ] Build/type/lint clean; review passed.
- [ ] Breakdown row updated.

---

## Open questions / human decisions

None. M45 remains deferred by baseline. Search matching style (contains vs prefix) left to PLAN with tests.

---

## Human approval

**Approved (2026-08-12)** as written. PLAN may proceed for AO-F-003. No production code in this artifact.
