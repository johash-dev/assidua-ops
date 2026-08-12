# Assidua Ops — Adversarial Requirements Review (New Findings after Session 4)

**Subject:** `docs/requirements/Assidua-Ops-requirements-baseline.md`  
**Feature ID:** AO-MVP-001  
**Review date:** 2026-08-11  
**Review type:** Adversarial requirements review (not architecture or code)  
**Authority:** Baseline is SSOT; grilling + Session 2/3/4 decisions — no invented answers  
**Scope:** **New residual findings only** (B9, I38–I45, M31–M36). Prior B1–B8 / I1–I37 / M1–M30 are resolved — do not re-litigate.

---

## Verdict

**Ready for architecture**, with one **Blocking** clarification (manual report week scope) before report/scheduler design is locked.

Session 4 resolved B8 and I31–I37 / M21–M30. Remaining invent-surface is small.

---

## Prior items (resolved — out of scope for this report)

| ID set | Status |
|--------|--------|
| B1–B7, I1–I30, M1–M20 | Resolved Sessions 2–3 |
| B8, I31–I37, M21–M30 | Resolved Session 4 |

---

## Blocking

### B9. Manual weekly report: which week?

**Confirmed:** Auto sends **previous** Mon–Sun at Monday 08:00. Manual generation exists (Admin all-dept / DH own-dept); latest artifact retained in-app per requester.  
**Gap:** Manual generation does not state whether it always regenerates the **same prior complete week** as auto, the **current partial week**, a **user-selected** week, or something else.  
**Why blocking:** Report API, UI, and acceptance (“generated report”) cannot be implemented without inventing week selection.  
**Decision needed:** Fixed prior week only / current week to-date / user picks a Mon–Sun week / other.

---

## Important

### I38. Exactly one DH: block two, not only zero

Vacancy (zero DHs) is blocked until replacement.  
**Gap:** Nothing explicitly rejects assigning a **second** DH while one already exists (except the hard-rule sentence). AC covers zero-path only.  
**Why it matters:** “Exactly one” can be violated unless dual assignment is rejected.

### I39. Notes on Closed / Cancelled jobs

Job **field** edits on Closed/Cancelled require Reopen. Notes authorship (Tech/DH/Admin) does not say whether notes may still be added after Close/Cancel.  
**Why it matters:** Terminal-state mutability and link invalidation (tech cannot add after Closed/Cancelled; DH/Admin might still).

### I40. Avg/median days-to-Close when zero Closed that week

Reopen rate and On Hold rate use **N/A** on zero denominator. Avg/median days-to-Close for a week with **no Closed jobs** is unspecified (empty / N/A / omit).  
**Why it matters:** Same class as I29; report AC incomplete for aging block.

### I41. Cross-department inquiry visibility for DH

One inquiry may span departments. DH has own-dept jobs R/W.  
**Gap:** When viewing an inquiry that also contains other departments’ jobs, does the DH see **only own-dept jobs**, or the **full inquiry** (read-only on foreign jobs)?  
**Why it matters:** Inquiry UI/API shape and over-exposure of other departments’ work.

### I42. WhatsApp message contents

Link is sent via WhatsApp; fail → copyable link.  
**Gap:** Body content unspecified (link-only vs customer name/phone/issue/site in the WhatsApp text).  
**Why it matters:** PII surface beyond the link; provider template constraints; leakage if mis-sent.

### I43. Department default N bounds

Per-job override / reopen custom: today-or-future **date**. Department default is **N calendar days**.  
**Gap:** Allowed range for N (0, negative, very large) unspecified. Bulk recalc from create+N can already yield past deadlines for old jobs.  
**Why it matters:** Validation and bulk-update at-risk side effects.

### I44. Same person as Admin and DH

One Admin role; exactly one DH per department.  
**Gap:** Whether a single staff user may hold **Admin and DH** at once (or DH for one dept while Admin) is unspecified.  
**Why it matters:** Seat model, “all admins” fan-out, and sole-DH replacement mechanics.

### I45. Notes in MVP audit list

Audit must-include list omits note add/edit.  
**Gap:** Confirm notes are **out** of MVP audit (intentional) vs omitted by accident.  
**Why it matters:** Compliance expectation vs I17 closed list.

---

## Minor

### M31. Risks still cite “Session 2/3” authority

Should include Session 4 for consistency with header/traceability.

### M32. Reclassify / FD leaf change within same department

“Notify both old and new DH” when old=new (same person) — single notify vs duplicate. Cosmetic.

### M33. Optional Resolved note whitespace

If a Resolved note is provided as whitespace-only: treat as empty (allow) vs reject. Only required notes have trim rules.

### M34. Workload “jobs per technician”

Whether technicians with **zero** open jobs appear as 0 rows is unspecified.

### M35. Seed / go-live: three DHs must exist

Hard rule implies every department always has a DH; initial provisioning dependency is implied but not stated as a go-live constraint.

### M36. NFR-1 / Open question 1

Intentionally open for implementation — not a business blocker if left as such (M30).

---

## Untestable or weak acceptance criteria (residual)

| Area | Problem |
|------|---------|
| Manual weekly report | Week scope undefined (B9) |
| Dual DH assignment | No reject AC (I38) |
| Notes after Close/Cancel | No AC (I39) |
| Avg/median with zero Closed | No N/A rule (I40) |
| DH view of multi-dept inquiry | No AC (I41) |
| WhatsApp body | No AC (I42) |

---

## Must resolve before architecture

**Hard gate:** **B9** (manual report week scope).

**Strongly recommended same gate:** **I38**, **I39**, **I41**.

**Park with owner + written assumption OK:** I40, I42–I45, M31–M36.

---

## What is solid (do not re-litigate)

Full Session 2–4 corpus, including: Close = **current** Resolved; dual DH notify; On Hold duration includes mid-week Cancel; per-job override today-or-future; sole-DH vacancy block; notes Tech/DH/Admin (not FD); latest manual in-app only; calendar days-to-Close; FR hygiene from Session 4; MVP exclusions.
