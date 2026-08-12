# Assidua Ops — Adversarial Requirements Review (New Findings after Session 6)

**Subject:** `docs/requirements/Assidua-Ops-requirements-baseline.md`  
**Feature ID:** AO-MVP-001  
**Review date:** 2026-08-11  
**Review type:** Adversarial requirements review (not architecture or code)  
**Authority:** Baseline is SSOT; grilling + Session 2/3/4/5/6 decisions — no invented answers  
**Scope:** **New residual findings only** (I54–I57, M43–M47). Prior B1–B9 / I1–I53 / M1–M42 are resolved — do not re-litigate.

---

## Verdict

**Ready for architecture.** No **Blocking** items. Session 6 closed I46–I53 / M37–M42. Remaining invent-surface is small.

---

## Prior items (resolved — out of scope for this report)

| ID set | Status |
|--------|--------|
| B1–B9, I1–I45, M1–M36 | Resolved Sessions 2–5 |
| I46–I53, M37–M42 | Resolved Session 6 |

---

## Blocking

*(None.)*

---

## Important

### I54. Time-to-resolve report shape still underspecified

TTR must appear on auto/manual reports (first cycle; also latest after reopen; N/A if empty).  
**Gaps:** (1) Display form — per-job rows vs avg/median aggregates vs both? (2) Population for a period — jobs whose **Resolved** fell in the period, jobs **Closed** in the period, or another set? (3) Unit — calendar days (like days-to-Close) vs elapsed time?  
**Why it matters:** I49 closed “include TTR” without a deterministic report formula/AC.

### I55. Cancel-reason edit vs audit

DH/Admin may edit cancel reason after Cancel (M41). Audit must capture Cancel/Reopen **with reasons**, but does not say whether **later reason edits** are audited.  
**Why it matters:** Silent history rewrite vs audit trail expectation.

### I56. Who may change technician primary department

Change is blocked while open jobs exist (I53).  
**Gap:** Whether **DH** may change primary department for techs in their pool (including moving them to another department when no open jobs), or **Admin only**.  
**Why it matters:** Directory ownership and cross-dept pool transfers.

### I57. Cancel reason after Reopen

Edit allowed “after Cancel.” If the job is later **Reopened**, may DH/Admin still edit the historical cancel reason, or only while status is Cancelled?  
**Why it matters:** Terminal-field mutability after reopen.

---

## Minor

### M43. Sibling indicator form

“Count or ‘jobs in other departments exist’” both allowed — fine for MVP; AC may accept either. Cosmetic consistency only.

### M44. Issue storage max length

Issue has no business max (only WhatsApp summary truncation). Storage/UI limits remain an implementation constraint unless stakeholders want a cap.

### M45. Phone format / WhatsApp suitability

Still a dependency (“suitable for WhatsApp”); no validation rule. Acceptable deferral.

### M46. NFR-1 / Open question 1

Intentionally open for implementation — not a business blocker (M42).

### M47. Snapshot metrics on historical manual periods

Assumption 8: snapshots remain “at generation time,” not as-of period end. Decided; call out in UX copy so users are not surprised.

---

## Untestable or weak acceptance criteria (residual)

| Area | Problem |
|------|---------|
| TTR on report | Included, but formula/population/unit incomplete (I54) |
| Cancel reason edit | Allowed; audit of edit unclear (I55) |
| Tech primary-dept change actor | Block-when-open only (I56) |
| Cancel reason after Reopen | Unspecified (I57) |

---

## Must resolve before architecture

**Hard gate:** none.

**Optional same-sprint clarifications (report/directory):** **I54**, **I56**.

**Park with owner + written assumption OK:** I55, I57, M43–M47.

---

## What is solid (do not re-litigate)

Full Session 2–6 corpus — lifecycle, SLA, sites, roles, reports, WhatsApp/copyable, notes add-only, sibling indicator, tech primary-dept lock with open jobs, MVP exclusions. Architecture may begin.
