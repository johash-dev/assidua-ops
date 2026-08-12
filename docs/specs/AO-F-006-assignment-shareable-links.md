# AO-F-006 — Assignment & hashed shareable links

**Feature ID:** AO-F-006  
**Parent:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED); ADR-003, ADR-004, ADR-005, ADR-007  
**Breakdown:** `docs/specs/AO-MVP-001-feature-breakdown.md`  
**Depends on:** AO-F-004 (technician directory), AO-F-005 (jobs exist; FD edit gate uses `technicianId`)  
**Status:** HUMAN APPROVED (2026-08-12)  
**Modules:** `assignment` + `links`  
**Deferred notes:** **M45** phone/WhatsApp suitability validation — store phone as entered; **NFR-1/M42** retry beyond WhatsApp→copyable is adapter-bounded only (no business SLA)

---

## Objective

Let DH/Admin select (and reassign/regenerate) technicians on open jobs, issue hashed shareable links, attempt WhatsApp delivery with copyable fallback, and expose a token-authenticated I27 allow-list job view (plus M52 invalid UX) — without implementing technician status/notes mutations (AO-F-007).

---

## Business context

Technicians have no login. DH/Admin assign from the directory; first select on New → Assigned and WhatsApp sends the link. Reassign keeps status; same-tech select = regenerate. Links are secrets: hash-at-rest, revoke on reassign/regenerate/Close/Cancel, expire 10 days after issuance. WhatsApp failure must not roll back assignment (I52).

---

## User story

As DH (or Admin), I pick a technician for a job so they receive a WhatsApp (or copyable) link and can open the job details; if the link dies or expires, I can regenerate/resend while the job is still open.

---

## Functional requirements

### Select / reassign / regenerate (FR-2)

- FR-A1: **DH** may select/reassign/regenerate only for jobs in **their** department, choosing an **active** technician whose **primary department** matches the job’s department (own pool) (FR-2.1).
- FR-A2: **Admin** may select/reassign/regenerate for **any** open job and may choose an active technician from **any** department (baseline edge: Admin may select outside job department pool).
- FR-A3: Front Desk and Coordinator **cannot** select/reassign/regenerate (Auth table).
- FR-A4: Select/reassign/regenerate on **Closed** or **Cancelled** is **rejected** until Reopen (FR-2.5 / I21).
- FR-A5: **First select** on a **New** job: set `technicianId`, status → **Assigned**, issue new current link, attempt WhatsApp after commit (FR-2.2).
- FR-A6: **Reassign** to a **different** technician: set new `technicianId`; **keep** existing status if already In Progress / On Hold / Resolved (or Assigned); revoke previous current link; issue new link; WhatsApp after commit (FR-2.3 / I15).
- FR-A7: Selecting the **same** technician already on the job = **regenerate/resend**: revoke previous link; issue new; WhatsApp after commit; **status unchanged** (FR-2.6 / M13).
- FR-A8: Explicit **regenerate/resend** (no technician change) while job open: same as FR-A7 (NFR-5).
- FR-A9: Inactive technicians **cannot** be selected (AO-F-004 FR-D11).
- FR-A10: Assignment persistence + link issue/revoke **commit first**; WhatsApp is **after commit / outside** the business transaction. WhatsApp failure **must not** roll back assignment/status/link; API returns `copyableText` identical to intended WhatsApp body (ADR-004 / I52).
- FR-A11: WhatsApp/copyable body = **link + customer name + site label + issue + priority** (not phone, primary address, or email in the message text). Truncate **issue in the summary** if needed for channel limits; **full issue** remains on the technician link view (I42/I52). Truncation length = provider/channel limit (Assumption 10) — PLAN documents bound; do not invent a business max.
- FR-A12: Audit technician select/reassign (and regenerate as select/reassign event per I17 intent). Emit `JobTimelineEvent` **Assigned** on first select; on reassign emit timeline as appropriate for reports (Assigned / technician-change — PLAN maps to ADR-006 without inventing extra business statuses).
- FR-A13: Phone format validation **deferred (M45)** — use technician phone as stored.

### Links (NFR-5, ADR-003)

- FR-A14: Generate **≥128-bit** cryptographically random token; persist **hash only** (e.g. SHA-256); URL carries raw token once; never log or persist raw token after issue.
- FR-A15: `JobShareLink`: issuedAt, expiresAt = issuedAt + **10 days**, revokedAt?, isCurrent. At most one **current** link per job.
- FR-A16: Link is **valid** iff: is current **and** not revoked **and** `now < expiresAt` **and** job status ∉ {Closed, Cancelled}.
- FR-A17: On Closed/Cancelled (AO-F-007), current link must become invalid (revoke or status check — FR-2.4). This feature owns the revoke/validate helpers F-007 will call.
- FR-A18: Invalid/expired/revoked: response/UI intent **“This job link is no longer valid. Contact your department head.”** — **no** job payload (M52 / M3).

### Technician read (FR-3.1 slice, ADR-007)

- FR-A19: Token-authenticated **GET** returns **I27 allow-list only**: issue, priority, status, category/leaf, site label+address, customer **name**, customer **phone**, deadline, notes thread (notes may be empty until F-007). Must **not** include: customer primary address, customer email, cancel reasons, audit, or other staff-only fields.
- FR-A20: Next.js `/t/[token]` obtains data **only** via NestJS token endpoints — no direct DB/Prisma/RSC bypass (ADR-007).
- FR-A21: Technician **status** and **notes** mutations are **out of scope** here (AO-F-007); invalid token must still reject those when added later.

---

## Non-functional requirements

- NFR-4 / NFR-5: NestJS enforces staff authz and token validity; hash-at-rest.
- NFR-1: WhatsApp is mandatory delivery channel for assignment; reliability beyond fail→copyable is adapter-bounded only (ADR-004/005).
- Development-tier WhatsApp per ADR-005 (sandbox/tester numbers); adapter interface unchanged for production swap.
- Adapter tests use fakes in CI (no live WhatsApp).

---

## Acceptance criteria

### Select / reassign / regenerate

- Given a New job in Rivon, when Rivon DH selects an active Rivon-primary technician, then status is Assigned, a current hashed link exists, WhatsApp send is attempted, and on WhatsApp failure the response includes `copyableText` equal to the intended body (assignment remains committed).
- Given WhatsApp success or failure, when checking DB, then assignment + link remain persisted (no rollback on WhatsApp fail).
- Given copyable/WhatsApp body, when inspected, then it contains link, customer name, site label, issue (possibly truncated), and priority — and does **not** contain customer phone, primary address, or email.
- Given a very long issue, when body is built, then summary issue is truncated and full issue remains on the allow-list GET.
- Given Assidua DH, when selecting a Rivon-primary technician for an Assidua job, then rejected; when Admin does the same cross-pool select, then allowed.
- Given FD or Coordinator, when attempting select/reassign/regenerate, then rejected.
- Given inactive technician, when select is attempted, then rejected.
- Given Closed or Cancelled job, when select/reassign/regenerate is attempted, then rejected.
- Given In Progress job assigned to A, when reassigned to B, then status stays In Progress, A’s token returns M52 invalid (no payload), B gets a new link/WhatsApp attempt.
- Given job assigned to A, when DH/Admin selects A again (or explicit regenerate), then previous link is invalid, new link issued, WhatsApp attempted, status unchanged.

### Link validity / tech read

- Given a valid current token for an open job, when GET `/t/:token` (or equivalent), then I27 allow-list fields are returned and forbidden fields are absent.
- Given revoked (reassign/regenerate), expired (>10 days since issued), Closed, or Cancelled, when token is presented, then M52 invalid intent is returned and **no** job payload.
- Given Next.js tech page, when loading job data, then it uses only the NestJS token API (enforced by architecture/tests — no Prisma in that route).

### Audit / timeline

- Given select/reassign/regenerate succeeds, when audit is queried, then technician select/reassign events exist; timeline includes Assigned (first select) as applicable (ADR-006).

---

## User-visible behavior

- DH/Admin: technician picker on open jobs (scoped pools); copyable fallback UI when WhatsApp fails or as returned; regenerate/resend control while open.
- FD/Coordinator: no select controls.
- Technician: `/t/[token]` read-only allow-list view in this slice; status/notes forms arrive in F-007; invalid page shows M52 message.

---

## API behavior

| Method | Resource | Authz | Behavior |
|--------|----------|-------|----------|
| POST | `/jobs/:id/assign` | DH (own dept + own pool); Admin (any job + any active tech) | Body `{ technicianId }`; first select / reassign / same-tech regenerate per rules; returns `{ copyableText, whatsAppOk }` (names PLAN-flexible) |
| POST | `/jobs/:id/regenerate-link` | DH own dept; Admin | Explicit regenerate; same delivery rules |
| GET | `/t/:token` | Token only | Valid → I27 DTO; else M52 invalid, no payload |

Staff assignment endpoints reject FD/Coordinator. No raw token in list/detail staff APIs after issue (staff may see “link sent” / copyableText from the mutating response only).

---

## Data behavior

- Job.`technicianId` set/updated by assignment; status New→Assigned on first select only.
- `JobShareLink`: jobId, tokenHash, issuedAt, expiresAt, revokedAt?, isCurrent.
- Validate by hashing presented token and matching current non-revoked non-expired link + open job status.
- WhatsApp adapter: `WhatsAppSender.send({ toPhone, body })` behind interface (ADR-004/005).

---

## Authorization

| Action | Admin | DH | Front desk | Coordinator | Tech token |
|--------|-------|----|------------|-------------|------------|
| Select/reassign/regenerate | Yes (any) | Own dept job + own pool | No | No | No |
| GET allow-list via token | — | — | — | — | Yes if valid |
| Tech status/notes mutate | — | — | — | — | F-007 |

---

## Error states

- FD/Coordinator assign → rejected.
- DH wrong dept job or wrong-pool technician → rejected.
- Inactive technician → rejected.
- Closed/Cancelled assign/regenerate → rejected.
- Invalid/expired/revoked token → M52; no payload.
- WhatsApp fail → assignment kept; `copyableText` returned (not a hard failure of assign).

---

## Edge cases

- Admin assigns technician whose primary department ≠ job department — allowed; new DH after reclassify may change technician later (F-005/F-007 interaction).
- Partial multi-job inquiry: assigning one job locks FD edits for that job only (F-005 FR-J13).
- Reopen with existing technician (F-007) → Assigned without new select; link may need regenerate — F-007 owns reopen; this feature’s regenerate remains available while open.
- Forwarded valid links remain usable until expiry/revoke (accepted residual risk).

---

## Dependencies

- AO-F-004 active technicians + primary department.
- AO-F-005 jobs (New, department, site, issue, priority, customer).
- WhatsApp + notification adapter (ADR-004/005); may ship with fake/sandbox in ENG PLAN.
- AO-F-007 for Close/Cancel revoke callers, tech status/notes, Reopen.
- Audit + timeline writers.

---

## Constraints

- Do not store raw tokens at rest.
- Do not invent phone validation (M45).
- Do not invent extra link controls beyond expiry + revoke.
- Do not implement tech In Progress/On Hold/Resolved or notes here (F-007).
- Do not roll back assignment on WhatsApp failure.
- Do not bypass NestJS for `/t/[token]` data.

---

## Out of scope

- Technician status transitions and notes (AO-F-007)
- Close/Cancel/Reopen actions (AO-F-007) — only provide invalidate helpers
- Staff notification settings UI (AO-F-009)
- FD technician select
- Technician login/app

---

## Test requirements

- Unit: New→Assigned; reassign keeps status; same-tech regenerate; Closed reject; pool/authz; inactive reject; hash validate; expiry; revoke; body builder truncate; I27 projection omits denied fields.
- Integration: assign HTTP matrix; WhatsApp fake fail → copyableText + committed assignment; GET `/t/:token` valid vs invalid.
- Playwright: DH assign → open link sees allow-list; reassign old link M52; WhatsApp fail shows copyable parity; FD cannot assign; Admin cross-pool assign.

---

## Definition of Done

- [ ] Spec human-approved.
- [ ] PLAN + implementation meet AC.
- [ ] Feature-owned tests + applicable E2E green; WhatsApp faked in CI.
- [ ] Build/type/lint clean; review passed.
- [ ] Breakdown row updated.

---

## Open questions / human decisions

None blocking. M45 and NFR-1/M42 remain deferred per baseline; truncation length is PLAN/channel constraint.

---

## Human approval

**Approved (2026-08-12)** as written (tech read in this slice; status/notes in F-007). PLAN may proceed for AO-F-006. No production code in this artifact.
