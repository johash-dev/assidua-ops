# AO-F-007 — Job lifecycle & notes

**Feature ID:** AO-F-007  
**Parent:** AO-MVP-001  
**Authority:** `docs/requirements/Assidua-Ops-requirements-baseline.md` (FROZEN); `docs/architecture/Assidua-Ops-architecture-mvp.md` (HUMAN APPROVED); ADR-006, ADR-007  
**Breakdown:** `docs/specs/AO-MVP-001-feature-breakdown.md`  
**Depends on:** AO-F-006 (technician present / valid link; link invalidate helpers)  
**Status:** HUMAN APPROVED (2026-08-12)  
**Modules:** `lifecycle` + `notes`  
**Deferred gate:** **I57** — cancel-reason edit after Reopen (historical reason) vs only while Cancelled  
**Also noted:** **I55** — whether cancel-reason *edits* are audited (viewer/AC hardening in AO-F-012; do not invent here)

---

## Objective

Enforce technician and DH/Admin status rules, Close/Cancel/Reopen (with reopen deadline prompt), cancel-reason edit while Cancelled, and add-only notes (staff + valid tech link) — including invalidating shareable links on Close/Cancel — without assignment, reclassify, or SLA default admin UX.

---

## Business context

After assignment, technicians update jobs via the shareable link (In Progress / On Hold / Resolved). DH/Admin may set the same statuses when a technician is present, and use dedicated Close / Cancel / Reopen actions. Notes are append-only. Reopen is an action (not a lasting status): → Assigned if technician present, else New. Cancelled exits the critical window; Closed requires **current** status Resolved (B8).

---

## User story

As DH (or Admin), I move jobs through field statuses, Close when Resolved, Cancel with a reason, Reopen when needed (choosing a deadline), and add notes; as a technician with a valid link, I set In Progress/On Hold/Resolved and add notes without a staff login.

---

## Functional requirements

### Technician status (FR-3.2–3.3)

- FR-L1: Via **valid** token only, technician may set status to **In Progress**, **On Hold**, or **Resolved** (no New/Assigned/Cancelled/Closed) (FR-3.2).
- FR-L2: **Resolved** requires the job has been **In Progress at least once** (`everBeenInProgress`); may resolve from On Hold if that flag is set. Otherwise reject.
- FR-L3: Technician **On Hold** requires a note non-empty after trim; whitespace-only note rejected (M24).
- FR-L4: Technician optional note on Resolved: whitespace-only treated as **no note** (do not store); allow (M33).
- FR-L5: Invalid/expired/revoked token → M52; no status/notes mutate (AO-F-006 validity).

### DH / Admin status (FR-4.1)

- FR-L6: DH (own dept) / Admin (any) may set **In Progress / On Hold / Resolved** only when a **technician is present**. New with no technician → reject those statuses (I7).
- FR-L7: DH/Admin **On Hold** note is **optional**; if provided, non-empty after trim; whitespace-only optional note = no note (I14).
- FR-L8: DH/Admin **cannot** free-jump to New, Assigned, Cancelled, or Closed via status PATCH — use select (F-006) or dedicated Close/Cancel/Reopen (I20).
- FR-L9: Front Desk and Coordinator **cannot** set lifecycle statuses, Close, Cancel, Reopen, or add notes.

### Close (FR-4.1, B8)

- FR-L10: Close is a **dedicated** action. Allowed only when **current** status is **Resolved**. Ever-Resolved alone is insufficient if later moved to In Progress/On Hold.
- FR-L11: On Close: status → Closed; invalidate current shareable link (F-006 helper); audit Close; timeline Close. Job counts as processed for SLA/reports (metrics consume later).

### Cancel (FR-4.2, M41)

- FR-L12: Cancel is a **dedicated** action. Reason required **non-empty after trim** (no further min/max). Whitespace-only rejected.
- FR-L13: On Cancel: status → Cancelled; store cancelReason; invalidate link; job exits critical window / at-risk eligibility; audit Cancel (+ reason); timeline Cancel.
- FR-L14: While status is **Cancelled**, DH/Admin may **edit cancel reason** (still non-empty after trim) (M41).
- FR-L15: **I57 GATE — cancel-reason edit after Reopen:** After Reopen, the job is no longer Cancelled. **Reject** cancel-reason edit unless status is **Cancelled**. Do **not** allow editing a historical cancel reason after Reopen until I57 is decided via requirements change (architecture: block post-Reopen edit).

### Reopen (FR-4.2)

- FR-L16: Reopen is a **dedicated** action from **Closed** or **Cancelled** only (DH own dept / Admin).
- FR-L17: On Reopen: if `technicianId` present → status **Assigned**; else → **New**. Prior technician remains by default (change tech = F-006 after reopen).
- FR-L18: Reopen **deadline prompt** (required): **keep** original deadline | **restart** from now using department `defaultSlaDays` | **custom** calendar date. Custom must be **today or future** Asia/Colombo; past rejected (I28). Keep-past-deadline is **allowed**; **no** immediate at-risk notification (M28 / F-010).
- FR-L19: Restart/custom deadline writes update `deadlineAt` (and per-job override flag as appropriate — align with AO-F-008 when present; until then set deadline fields consistently with F-005 create math). Audit Reopen; timeline Reopen. Do **not** invent a lasting “Reopened” status.

### Notes (FR-4.4, I48, I39)

- FR-L20: **Add-only** notes: Technician (valid link), DH (own dept jobs), Admin. **No** edit/delete of existing notes (I48).
- FR-L21: Front Desk **cannot** add notes.
- FR-L22: DH/Admin may add notes on **Closed/Cancelled** without Reopen (I39). Technician cannot (link invalid).
- FR-L23: Notes are **not** required in MVP audit (I45). Notes appear on I27 tech GET while link valid (F-006 DTO already lists notes thread).
- FR-L24: Note body: non-empty after trim for intentional notes; author + timestamp stored.

### Cross-cutting writes

- FR-L25: Status transitions emit audit (I17) and `JobTimelineEvent` status / On Hold enter-exit / Close / Cancel / Reopen as applicable (ADR-006).
- FR-L26: **I55:** Cancel **action** is audited with reason. Whether cancel-reason **edit** events are audited is deferred — do not invent inclusion/exclusion AC here; harden in AO-F-012 when I55 decided.
- FR-L27: Reclassify remains AO-F-005. Assignment remains AO-F-006.

---

## Non-functional requirements

- NFR-3: Reopen custom/keep/restart calendar uses **Asia/Colombo**.
- NFR-4: NestJS enforces staff role/dept and token auth; UI not trusted.
- NFR-6: Last-write-wins.
- Repository-only DB; rules in `lifecycle` / `notes` services; link invalidate via `links` service.

---

## Acceptance criteria

### Technician status / notes

- Given valid link + Assigned job, when technician sets In Progress, then status is In Progress and `everBeenInProgress` is true.
- Given never In Progress, when technician sets Resolved, then rejected.
- Given prior In Progress then On Hold, when technician sets Resolved, then allowed.
- Given technician On Hold with whitespace-only/missing note, when saving, then rejected; with non-empty trimmed note, then On Hold succeeds and note is stored.
- Given Resolved with whitespace-only note, when saving, then Resolved succeeds and no note row is stored.
- Given invalid token, when status or note mutate, then M52 / rejected with no job mutation.
- Given valid link, when technician adds a note, then it appears in the thread on subsequent GET.

### DH / Admin status

- Given job with technician, when DH/Admin sets In Progress/On Hold/Resolved, then allowed (On Hold note optional).
- Given New job with no technician, when DH/Admin attempts In Progress/On Hold/Resolved, then rejected.
- Given DH/Admin free-jump to New/Assigned/Cancelled/Closed via status endpoint, when saving, then rejected.
- Given FD or Coordinator, when attempting status/Close/Cancel/Reopen/notes, then rejected.

### Close / Cancel / Reopen

- Given never Resolved, when Close, then rejected.
- Given current Resolved, when Close, then Closed, link invalid (M52 on old token), audit/timeline Close.
- Given Resolved then In Progress, when Close while not Resolved, then rejected.
- Given Cancel with empty/whitespace reason, when saving, then rejected; with non-empty reason, then Cancelled, link invalid, reason stored.
- Given Cancelled, when DH/Admin edits cancel reason to new non-empty value, then accepted; empty/whitespace rejected.
- Given job was Cancelled then Reopened (now Assigned/New), when DH/Admin attempts cancel-reason edit, then **rejected** (I57 gate — edit only while Cancelled).
- Given Closed/Cancelled with technician, when Reopen with keep/restart/custom (valid), then status Assigned, technician kept, deadline applied per choice.
- Given Closed/Cancelled with no technician, when Reopen, then status New; no shareable link until F-006 select.
- Given reopen custom deadline in the past (Colombo), when confirming, then rejected.
- Given reopen keep with already-past deadline, when reopen completes, then no immediate at-risk send (scheduler F-010).

### Notes

- Given DH/Admin, when adding a note on Closed/Cancelled, then accepted.
- Given FD, when adding a note, then rejected.
- Given any role, when editing or deleting an existing note, then rejected.

### Audit / timeline (non-I55)

- Given Close/Cancel/Reopen/status change, when audit/timeline queried, then corresponding events exist (Cancel includes reason on the Cancel action). Notes adds are not required in audit.

---

## User-visible behavior

- DH/Admin: status controls (with tech), Close, Cancel (+ reason + edit while Cancelled), Reopen deadline prompt, add notes (including Closed/Cancelled).
- Technician `/t/[token]`: status In Progress/On Hold/Resolved + add notes while valid; M52 when invalid.
- FD/Coordinator: no lifecycle mutate / no notes.

---

## API behavior

| Method | Resource | Authz | Behavior |
|--------|----------|-------|----------|
| PATCH | `/jobs/:id/status` | DH own dept / Admin; tech via token endpoint | Set In Progress/On Hold/Resolved per rules; reject free-jumps |
| POST | `/jobs/:id/close` | DH own dept / Admin | Current must be Resolved |
| POST | `/jobs/:id/cancel` | DH own dept / Admin | Body `{ reason }`; trim required |
| PATCH | `/jobs/:id/cancel-reason` | DH own dept / Admin | **Only if status = Cancelled** (I57); trim required |
| POST | `/jobs/:id/reopen` | DH own dept / Admin | Body `{ deadlineMode: keep\|restart\|custom, customDate? }` |
| POST | `/jobs/:id/notes` | DH own dept / Admin (incl. Closed/Cancelled); tech via token | Append-only |
| PATCH | `/t/:token/status` | Valid token | Tech status rules |
| POST | `/t/:token/notes` | Valid token | Tech add note |

Exact path names may be grouped under `/t/:token` per ADR-007; behavior is normative.

---

## Data behavior

- Job.status transitions as above; `everBeenInProgress` boolean; `cancelReason` set on Cancel; editable only while Cancelled (I57).
- `JobNote`: id, jobId, body, authorType (TECH\|DH\|ADMIN), authorStaffUserId?, createdAt; no update/delete API.
- On Close/Cancel: call links invalidate (revoke current or rely on status∉open check — both must yield M52).
- Timeline: status transitions, On Hold enter/exit timestamps, Close, Cancel, Reopen (ADR-006).

---

## Authorization

| Action | Admin | DH | Front desk | Coordinator | Tech token |
|--------|-------|----|------------|-------------|------------|
| Set In Progress/On Hold/Resolved | Yes (tech present) | Own dept (tech present) | No | No | Yes (FR-L1–L4) |
| Close / Cancel / Reopen | Yes | Own dept | No | No | No |
| Edit cancel reason | Yes if Cancelled | Own dept if Cancelled | No | No | No |
| Add notes | Yes (incl. Closed/Cancelled) | Own dept (incl. Closed/Cancelled) | No | No | Yes if link valid |
| Edit/delete notes | No | No | No | No | No |

---

## Error states

- Free-jump New/Assigned/Cancelled/Closed → rejected.
- Close while not current Resolved → rejected.
- Cancel / cancel-reason edit with empty/whitespace → rejected.
- Cancel-reason edit when status ≠ Cancelled → rejected (I57).
- Status without technician (staff) → rejected.
- Tech Resolved without ever In Progress → rejected.
- Tech On Hold without note → rejected.
- FD/Coordinator lifecycle or notes → rejected.
- Reopen custom past date → rejected.
- Invalid token mutate → rejected / M52.

---

## Edge cases

- Cancel from New (never selected technician) allowed with reason.
- Reopen Cancelled with no technician → New; with technician → Assigned (no auto new WhatsApp until regenerate/select — F-006).
- On Hold does not change deadline (FR-5.3); clock continues.
- Partial multi-job inquiry: lifecycle per job.
- DH cannot act on other departments’ jobs.
- After Reopen, historical `cancelReason` may remain stored for staff history but is **not** editable until I57 decides otherwise; tech link must not show cancel reasons (I27 / F-006).

---

## Dependencies

- AO-F-006 assignment + link validate/invalidate + I27 GET (notes thread field).
- AO-F-005 jobs; AO-F-002 roles; department `defaultSlaDays` for restart.
- AO-F-008 may refine per-job override flags on reopen custom/restart; this feature must still apply keep/restart/custom correctly.
- AO-F-010 at-risk scheduler (no immediate ping on reopen).
- Audit + timeline writers; **I55** for cancel-reason-edit audit AC later.
- **I57** requirements decision before allowing post-Reopen cancel-reason edit.

---

## Constraints

- Do not invent a Reopened status.
- Do not silently allow cancel-reason edit after Reopen (I57).
- Do not invent note edit/delete.
- Do not put notes in MVP audit requirement.
- Do not implement reclassify/assign/SLA defaults UI here.
- Do not send immediate at-risk on reopen (M28).

---

## Out of scope

- Technician select / WhatsApp (AO-F-006)
- Reclassify / inquiry create (AO-F-005)
- SLA department default bulk update / per-job override admin screens (AO-F-008)
- At-risk daily job (AO-F-010)
- Audit viewer; I55 cancel-reason-edit audit decision (AO-F-012)
- Resolving I57 (escalate for requirements change)

---

## Test requirements

- Unit: B8 Close; Cancel reason trim; I57 reject post-Reopen reason edit; tech Resolved gate; tech vs DH On Hold notes; free-jump reject; reopen Assigned vs New; reopen deadline modes; notes add-only; FD deny; link invalidate on Close/Cancel.
- Integration: staff + `/t/:token` authz matrices.
- Playwright: assign → tech In Progress → Resolved → Close; Cancel + edit reason while Cancelled; reopen; notes add-only; FD cannot note; post-Reopen cancel-reason edit rejected.

---

## Definition of Done

- [ ] Spec human-approved (including I57 stance).
- [ ] PLAN + implementation meet AC.
- [ ] Feature-owned tests + applicable E2E green.
- [ ] Build/type/lint clean; review passed.
- [ ] Breakdown row updated; I57 still listed open for later.

---

## Open questions / human decisions

1. **I57** remains deferred — this spec locks cancel-reason edit to **status = Cancelled only**. Confirm that stance for MVP build (recommended) or supply a requirements change to allow post-Reopen historical edits.

No other blockers. I55 left to F-012.

---

## Human approval

**Approved (2026-08-12)** as written (cancel-reason edit only while Cancelled until I57). PLAN may proceed for AO-F-007. No production code in this artifact.
