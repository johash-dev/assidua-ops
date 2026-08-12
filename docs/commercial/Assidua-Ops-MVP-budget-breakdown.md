# Assidua Ops — MVP Budget Breakdown

**Proposal fee:** LKR **650,000** fixed  
**Target band:** LKR 500,000 – 700,000  
**Duration:** 3 weeks  
**Currency:** Sri Lankan Rupee (LKR)  
**Date:** 2026-08-12 (amended 2026-08-13 — RC-001 absorbed in F-005 / F-009 without raising the fixed fee)

This is an **allocation of the fixed fee** for transparency and milestone tracking. It is not a time-and-materials estimate, and line items are not separately cancellable without a change request (except by mutual written agreement).

**RC-001 note:** Customer inquiry SMS + inquiry numbers are included in the **LKR 650,000** fee via AO-F-005 / AO-F-009 scope. Client-paid SMS gateway usage remains outside the fee (see recurring costs).

---

## 1. Summary

| Category | Amount (LKR) | Share |
|----------|-------------:|------:|
| Platform & cross-cutting foundation | 65,000 | 10% |
| Core domain features (AO-F-001…012) | 565,500 | 87% |
| UAT support, stabilization & go-live handoff | 19,500 | 3% |
| **Total fixed fee** | **650,000** | **100%** |

**Not included in the 650,000:** hosting, domains, managed database, email/WhatsApp/SMS provider fees, SSL beyond host defaults, post-warranty support retainer.

---

## 2. Feature-level breakdown

| Order | ID | Package | Amount (LKR) | % of fee | Notes |
|------:|----|---------|-------------:|--------:|-------|
| 0 | AO-ENG-000 | Platform foundation (Next.js + NestJS + Prisma + CI + env baseline) | 65,000 | 10.0% | Deployable skeleton; DB; CI; app wiring |
| 1 | AO-F-001 | Department & category taxonomy | 26,000 | 4.0% | Admin manage; deactivate guards |
| 2 | AO-F-002 | Staff identity (login/session, users/roles, sole-DH rules) | 65,000 | 10.0% | Auth boundary; role exclusivity |
| 3 | AO-F-003 | Customers & sites | 39,000 | 6.0% | Search/select; multi-site; delete guards |
| 4 | AO-F-004 | Technician directory | 32,500 | 5.0% | Directory CRUD; I56 = Admin-only primary dept change |
| 5 | AO-F-005 | Inquiry & job intake (+ inquiry number) | 78,000 | 12.0% | Atomic multi-job create; edit/reclassify; RC-001 number |
| 6 | AO-F-006 | Assignment & hashed shareable links (+ WhatsApp/copyable) | 65,000 | 10.0% | Token links; WhatsApp + fallback |
| 7 | AO-F-007 | Job lifecycle & notes | 65,000 | 10.0% | Status/Close/Cancel/Reopen; add-only notes; I57 default |
| 8 | AO-F-008 | SLA defaults, override, deadline calc | 32,500 | 5.0% | Colombo calendar rules |
| 9 | AO-F-009 | Notifications (in-app/email/SMS + settings) | 52,000 | 8.0% | Adapters; Admin toggles; RC-001 customer SMS |
| 10 | AO-F-010 | Scheduler (daily at-risk + weekly auto trigger) | 32,500 | 5.0% | 08:00 Asia/Colombo |
| 11 | AO-F-011 | Performance reports (manual + auto fan-out) | 52,000 | 8.0% | I54 = raw TTR + placeholder only |
| 12 | AO-F-012 | Audit log views (Admin full / DH dept) | 26,000 | 4.0% | I55 = no cancel-reason-edit audit AC |
| — | — | UAT support, defect burn-down, handoff runbook | 19,500 | 3.0% | Week 3 acceptance focus |
| | | **Total** | **650,000** | **100%** | |

---

## 3. Payment milestones (mapped to budget)

| Milestone | Trigger | Amount (LKR) | % | Covers (indicative) |
|-----------|---------|-------------:|--:|---------------------|
| M1 — Kickoff | Contract signed + kickoff access | 260,000 | 40% | ENG-000 through early F-004 start; Week 1 |
| M2 — Mid-build | Week 2 checkpoint: inquiry → assign → link → lifecycle demo accepted | 195,000 | 30% | Through F-007/F-008 core path |
| M3 — Delivery | MVP UAT sign-off | 195,000 | 30% | F-009…012 + UAT/go-live allocation |

---

## 4. Optional fee positions (same scope)

If negotiating inside the band without changing scope:

| Position | Fixed fee (LKR) | When to use |
|----------|----------------:|-------------|
| Floor | 500,000 | Only if client accepts higher delivery risk / narrower warranty (not recommended) |
| **Proposed** | **650,000** | Balanced for 3-week compressed MVP |
| Ceiling | 700,000 | Prefer if WhatsApp production onboarding is uncertain or client needs extra UAT days |

**Scaling rule (same % weights):**  
`line_amount = proposed_line × (chosen_fee / 650,000)`.

Example at LKR 700,000: multiply every line in §2 by `700000/650000 ≈ 1.0769`.

---

## 5. Change-request pricing (post-sign)

Indicative only — firm quote per request:

| Type | Typical treatment |
|------|-------------------|
| Rule tweak within an existing screen (no new module) | Small fixed add-on or swap against contingency (written) |
| New module / channel / role / integration | Re-estimate; timeline usually extends |
| Resolving I54 into a full aggregate TTR product UX | Out of MVP; separate estimate |
| Post-MVP: technician login app, billing, portal, photos, GPS | Separate proposal |

---

## 6. Client-owned recurring costs (excluded)

Not part of the 650,000 build fee. Full lower/upper ranges:

→ **`docs/commercial/Assidua-Ops-MVP-recurring-costs.md`**

| Planning band | Monthly (LKR) |
|---------------|--------------:|
| Lower | 15,000 – 28,000 |
| Upper | 75,000 – 135,000 |

---

## 7. Internal note (do not send to client)

- Fee is **value/scope priced**, not hours × rate. AI-accelerated build is how the 3-week calendar is attempted; **client UAT against AC is the quality gate**.
- Compressing full AO-F-001…012 into 21 days is high operational risk; protect with change freeze, 1-day client response SLA, and Sev-1-only mid-build fixes.
- Prefer quoting **650k–700k** over 500k given no human code-review buffer in your process — keep warranty short (14 days) as written in the proposal.
