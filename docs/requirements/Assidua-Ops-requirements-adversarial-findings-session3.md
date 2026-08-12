# Assidua Ops — Adversarial Requirements Review (New Findings after Session 3)

**Subject:** `docs/requirements/Assidua-Ops-requirements-baseline.md`  
**Feature ID:** AO-MVP-001  
**Review date:** 2026-08-11  
**Review type:** Adversarial requirements review (not architecture or code)  
**Authority:** Baseline is SSOT; grilling + Session 2/3 decisions — no invented answers  
**Scope:** **New residual findings only** (B8, I31–I37, M21–M30). Prior B1–B7 / I1–I30 / M1–M20 are resolved — do not re-litigate.

---

## Verdict

**Ready for architecture**, with one **Blocking** clarification to close before status-machine design is locked, plus a short Important list that will otherwise cause silent invention.

Session 3 resolved B7, I20–I30, and M10–M20. Remaining issues are narrower than prior rounds.

---

## Prior items (resolved — out of scope for this report)

| ID set | Status |
|--------|--------|
| B1–B6, I1–I19, M1–M9 | Resolved Session 2 |
| B7, I20–I30, M10–M20 | Resolved Session 3 |

---

## Blocking

### B8. Close precondition: current status vs ever-Resolved

**Confirmed / AC:** Close allowed only after the job has been **Resolved**; AC rejects Close when the job has **never** been Resolved.  
**Gap:** If DH/admin sets Resolved, then free-jumps to **In Progress** or **On Hold**, may they Close while current status is not Resolved?  
**Why blocking:** Defines the Close transition in the status machine and whether “prior Resolved” is historical or “must be Resolved now.”  
**Decision needed:** Close only when **current** status is Resolved, **or** Close allowed from any open status once Resolved has occurred at least once.

---

## Important

### I31. FR-4.3 contradicts Session 3 reclassify notify (I22)

**Confirmed / Decision 63 / AC:** reclassify notifies **both** old and new DH.  
**FR-4.3 still says:** “new DH notified” only.  
**Why it matters:** Implementers who code from FR will ship the wrong notification behavior. Hygiene fix or explicit FR update required; do not invent a third rule.

### I32. On Hold duration sum vs mid-week Cancelled jobs

**On Hold rate (I23):** mid-week Cancelled jobs still count in numerator/denominator if they were open / entered On Hold.  
**On Hold duration sum:** “total time spent On Hold during the week across **non-Cancelled** jobs.”  
**Ambiguity:** Exclude jobs Cancelled by report time (drop their On Hold hours), or exclude only pre-week Cancelled, or exclude On Hold time after Cancel?  
**Why it matters:** Report metric not fully deterministic; asymmetric with I23 unless clarified.

### I33. Per-job SLA override date bounds

Reopen **custom** deadline: today or future only (I28).  
**Per-job override** has no stated min/max (past deadline, before create date, zero/negative N).  
**Why it matters:** Immediate perpetual at-risk vs reject vs allow — same class of decision as I28.

### I34. “Exactly one DH per department” vacancy / replacement

Hard rule: one DH per department. No rule for temporary vacancy, dual assignment prevention beyond count, or what happens when the sole DH staff user is deactivated/role-changed.  
**Why it matters:** Role provisioning and notification fan-out (“owning DH”) break if zero DHs is possible.

### I35. Who may author notes (beyond technician)

Technician may add notes; On Hold note rules differ by actor. Whether FD/DH/Admin may add notes to the thread (visible on the technician link) is unspecified.  
**Why it matters:** Notes are on the link allow-list (I27); staff-authored content becomes field-visible PII/process detail.

### I36. Weekly report retention / history beyond the triggering session

Manual success keeps report **available in-app** for the requester. No rule for how long, whether auto-report recipients can view past weeks in-app, or whether only the latest manual artifact exists.  
**Why it matters:** Scope of “in-app report” storage vs email-only history.

### I37. AC gaps for Session 3 decisions (testability)

Confirmed but thin or missing in Acceptance criteria: same-technician select = regenerate/resend; rate **N/A** on zero denominator; reopen past custom deadline rejected; technician allow/deny field list; Admin may set another department’s SLA default.  
**Why it matters:** SSOT says AC are authoritative for tests (M16); missing ACs invite under-testing.

---

## Minor

### M21. FR-2.4 omitted / Closed–Cancelled link invalidation only in Confirmed

FR jumps FR-2.3 → FR-2.5. Link stop on Closed/Cancelled remains in Confirmed behavior; restore FR for traceability.

### M22. FR-3.1 still says generic “view job information”

Should point at I27 allow/deny list (same class as I31 FR lag).

### M23. Human decisions header says “1–71” while Decisions run through 81

Stale cross-reference after Session 3.

### M24. Cancel reason / On Hold note vs issue trim

Issue: non-empty **after trim**. Cancel reason and technician On Hold note: “non-empty” only — whitespace-only behavior unspecified.

### M25. Duplicate leaf in one inquiry

“One job per leaf” implies uniqueness; no explicit reject AC for two jobs with the same leaf in one submission.

### M26. Days-to-Close unit

Avg/median “days” — calendar dates vs fractional elapsed time not stated (SLA elsewhere uses calendar dates).

### M27. DH site edit not scoped by department

DH may create/edit any customer’s sites, not only customers with own-dept jobs. Likely acceptable; confirm if unintended breadth.

### M28. Immediate at-risk after reopen with kept past deadline

Deadline prompt is immediate; at-risk remains the 08:00 daily run. No extra immediate at-risk ping on reopen-into-past-deadline — confirm acceptable.

### M29. Empty inquiry

Create is “one or more jobs”; no separate AC that zero-job inquiry is rejected (implied by job-required fields).

### M30. NFR-1 delivery retry beyond WhatsApp fallback

Still intentionally open for implementation constraints; not a business gap if left as such.

---

## Untestable or weak acceptance criteria (residual)

| Area | Problem |
|------|---------|
| Close after Resolved→On Hold/In Progress | Current vs historical Resolved (B8) |
| On Hold duration sum | Mid-week Cancelled population (I32) |
| Per-job override | Past/invalid dates (I33) |
| Same-tech select, N/A rates, link field hide list, Admin cross-dept SLA, past custom deadline | Thin/missing AC (I37) |
| FR-4.3 | Conflicts with AC/Confirmed on dual DH notify (I31) |

---

## Scope leakage / cost drivers

Unchanged material MVP cost: WhatsApp + fallback; dual-channel notify; daily at-risk; weekly reports; audit list; secret links + expiry + regenerate; in-app manual report artifact (I24).

Do not expand NFR-7 without a new business decision. Audit retention remains deferred (M18) — do not invent a retention product in architecture.

---

## Must resolve before architecture

**Hard gate:** **B8** (Close = current Resolved vs ever-Resolved).

**Fix before build / early architecture:** **I31** (align FR-4.3 with Confirmed — not a new product decision).

**Strongly recommended same gate:** **I32**, **I33**, **I34**.

**Park with owner + written assumption OK:** I35–I37, M21–M30.

---

## What is solid (do not re-litigate)

Session 2+3 corpus: leaf-derived department; atomic multi-job / cross-dept inquiry; no late append; one DH per department; one Admin role; coordinator/FD deny lists; site rights (B7); no customer/inquiry/job delete; Close requires Resolved (modulo B8 current-vs-historical); Cancelled exits SLA; Assigned↔technician; reopen Assigned/New; dedicated Cancel/Close/Reopen; dual DH notify on FD change and reclassify; calendar SLA + 08:00 at-risk; report metrics + N/A; TTR first+latest; link secret/expiry/fields; audit include/exclude; last-write-wins; MVP exclusions.
