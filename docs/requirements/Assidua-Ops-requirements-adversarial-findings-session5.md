# Assidua Ops — Adversarial Requirements Review (New Findings after Session 5)

**Subject:** `docs/requirements/Assidua-Ops-requirements-baseline.md`  
**Feature ID:** AO-MVP-001  
**Review date:** 2026-08-11  
**Review type:** Adversarial requirements review (not architecture or code)  
**Authority:** Baseline is SSOT; grilling + Session 2/3/4/5 decisions — no invented answers  
**Scope:** **New residual findings only** (I46–I53, M37–M42). Prior B1–B9 / I1–I45 / M1–M36 are resolved — do not re-litigate.

---

## Verdict

**Ready for architecture.** No new **Blocking** items. Session 5 closed B9 and I38–I45 / M31–M36. Remaining invent-surface is Important/Minor only.

---

## Prior items (resolved — out of scope for this report)

| ID set | Status |
|--------|--------|
| B1–B8, I1–I37, M1–M30 | Resolved Sessions 2–4 |
| B9, I38–I45, M31–M36 | Resolved Session 5 |

---

## Blocking

*(None.)*

---

## Important

### I46. Manual report date-range bounds (span / future end)

Requester may pick any start/end (end ≥ start).  
**Gap:** No max span; no rule on **future** end dates (or start far in the past).  
**Why it matters:** Cost/timeouts for huge ranges; snapshot metrics mixed with a future period are ambiguous.

### I47. Manual period inclusive calendar bounds

Start/end are calendar dates; inclusive vs exclusive end-of-day not spelled out (though Asia/Colombo day semantics exist for SLA).  
**Why it matters:** Event bucketing AC edge cases (created at 23:59 on end date).

### I48. Note edit / delete

Tech/DH/Admin may **add** notes; edit or delete of existing notes is unspecified.  
**Why it matters:** Thread integrity, last-write-wins fights, and staff correcting typos.

### I49. Time-to-resolve delivery channel

TTR is defined (first + latest cycle) under reporting metrics, but the auto/manual **report content list** does not explicitly include TTR.  
**Why it matters:** Implementers may omit TTR from the shipped report or invent a separate surface.

### I50. Staff multi-role beyond Admin≠DH

Admin and DH are mutually exclusive. Whether one user may combine **FD + Coordinator**, **FD + Admin**, etc. is unspecified.  
**Why it matters:** Auth model and provisioning rules.

### I51. DH awareness of hidden sibling jobs on multi-dept inquiry

Other departments’ jobs are **hidden**.  
**Gap:** No signal that siblings exist (count/indicator) vs fully invisible.  
**Why it matters:** DH may think the inquiry is single-job; coordination across depts relies on tribal knowledge.

### I52. WhatsApp / copyable-link content parity and issue length

WhatsApp body = link + name, site label, issue, priority.  
**Gaps:** (1) Copyable fallback — URL only or same summary text? (2) Very long **issue** text vs WhatsApp limits / truncation.  
**Why it matters:** PII consistency and send failures.

### I53. Changing a technician’s primary department while they have open jobs

Deactivate-with-open-jobs is blocked. Changing **primary department** while assigned to open jobs is unspecified (pool membership vs existing assignments).  
**Why it matters:** DH pool lists and cross-dept assignment integrity.

---

## Minor

### M37. Decision 30 still says volume is Mon–Sun only

Stale vs Session 5 manual **selected period**; Confirmed behavior / Decision 17 / 94 win — fix Decision 30 wording.

### M38. FR-8.1 omits “notify once if same DH”

Confirmed + FR-4.3 have M32; FR-8.1 does not.

### M39. Same-dept leaf change “notify once” has no dedicated AC

Behavior stated; AC only covers cross-dept FD change.

### M40. Manual start = end (single calendar day)

Implied allowed (only end-before-start rejected); worth an explicit AC.

### M41. Cancel reason immutability after Cancel

Whether cancel reason can be edited later is unspecified.

### M42. NFR-1 / Open question 1

Intentionally open for implementation — not a business blocker (M36).

---

## Untestable or weak acceptance criteria (residual)

| Area | Problem |
|------|---------|
| Manual range max / future end | No AC (I46) |
| Period inclusive bounds | Implicit only (I47) |
| Note edit/delete | No AC (I48) |
| TTR on report | Defined metric, not in report bullet AC (I49) |
| Multi-role combos | Only Admin≠DH AC (I50) |
| Copyable body / issue truncation | No AC (I52) |
| Tech primary-dept change with open jobs | No AC (I53) |

---

## Must resolve before architecture

**Hard gate:** none.

**Strongly recommended before report/roles design:** **I46**, **I49**, **I50**.

**Park with owner + written assumption OK:** I47–I48, I51–I53, M37–M42.

---

## What is solid (do not re-litigate)

Full Session 2–5 corpus, including: Close = current Resolved; Cancelled exits SLA; Assigned↔technician; dedicated Cancel/Close/Reopen; manual any date range; exactly one DH (zero+dual blocked); Admin≠DH; DH own-dept jobs only on multi-dept inquiry; WhatsApp summary fields; N ≥ 1; notes after Closed for DH/Admin; notes out of audit; N/A empty metrics; workload includes zero-job techs; go-live three DHs; MVP exclusions.
