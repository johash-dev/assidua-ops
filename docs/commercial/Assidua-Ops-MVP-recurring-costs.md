# Assidua Ops — Client Recurring Cost Breakdown

**Purpose:** Estimate **ongoing costs paid by the client** (hosting, messaging, domain) — **not** part of the LKR 650,000 build fee.  
**Currency:** Sri Lankan Rupee (LKR)  
**FX assumption for this sheet:** **1 USD ≈ LKR 335** (bank selling nearer ~338 as of 2026-08-12 — re-check before budgeting)  
**Date:** 2026-08-12 (amended 2026-08-13 — RC-001 customer inquiry SMS)  
**Status:** Planning estimate only. Vendor list prices change; WhatsApp/SMS rates are country- and category-specific.

---

## 1. Summary (monthly, production MVP)

| Band | Monthly total (LKR) | Typical profile |
|------|--------------------:|-----------------|
| **Lower range** | **15,000 – 28,000** | One small production stack; lean DB; low job/message volume; free-tier email where possible; SMS off or low volume |
| **Upper range** | **75,000 – 135,000** | Production + staging; managed DB; higher message volume; paid email; SMS on; basic monitoring; FX/vendor buffer |

| | Lower range | Upper range |
|--|------------:|------------:|
| **Indicative mid** | ~22,000 / month | ~105,000 / month |
| **Annualised (×12)** | ~180,000 – 336,000 | ~900,000 – 1,620,000 |

These are **client-owned** invoices. The software build fee does not include them.

---

## 2. What the client pays for (MVP architecture)

Per approved architecture / ADRs:

| Need | Why | Example vendors (illustrative) |
|------|-----|--------------------------------|
| App hosting | Next.js UI + NestJS API (single deployable pattern; in-process scheduler) | Railway, Render, Fly.io, DigitalOcean, Hetzner, VPS |
| PostgreSQL | System of record (Prisma) | Same host, Neon, Supabase, RDS, managed Postgres |
| Transactional email | Staff notifications + weekly/manual reports | Resend, Amazon SES, Postmark, SendGrid |
| WhatsApp Business Platform | Technician assignment / regenerate links (utility-style templates) | Meta Cloud API direct, or a Business Solution Provider (BSP) |
| SMS gateway | Customer inquiry acknowledgement (when Admin enables) | Twilio, Vonage, or a local Sri Lanka SMS aggregator |
| Domain + DNS + TLS | Public staff + technician link URLs | Local/global registrar; Let's Encrypt / host TLS |
| Source hosting (optional paid) | Private repo | GitHub Free / Team |

**Not required for MVP recurring spend (architecture):** Redis, queue product, search cluster, paid IdP (Clerk/Auth0), separate worker fleet.

---

## 3. Line-item monthly ranges (LKR)

Volumes below are **planning scenarios**, not forecasts. Adjust after 30 days of real usage.

### 3.1 Always-on infrastructure

| Line item | Lower (LKR/mo) | Upper (LKR/mo) | What drives the band |
|-----------|---------------:|---------------:|----------------------|
| Domain + DNS (amortised) | 500 | 2,500 | Cheap `.lk`/`.com` vs premium DNS / multi-domain |
| TLS / certificates | 0 | 0 | Free TLS via host or Let's Encrypt (paid certs optional) |
| App compute (API + web) | 5,000 | 30,000 | Single small instance vs larger / multi-region / always-on staging twin |
| PostgreSQL | 0 | 25,000 | Lower = DB on same VPS; upper = managed DB + storage + PITR-ish backups |
| Staging environment | 0 | 20,000 | Lower = no dedicated staging (or shared); upper = separate app + DB |
| Backups / snapshots | 500 | 5,000 | Host snapshots vs managed backup retention |
| Error / uptime monitoring (optional but recommended) | 0 | 10,000 | Lower = host metrics only; upper = Sentry/equivalent + uptime pings |
| **Subtotal infrastructure** | **6,000** | **92,500** | |

### 3.2 Messaging (usage-based)

| Line item | Lower (LKR/mo) | Upper (LKR/mo) | Planning volume hint |
|-----------|---------------:|---------------:|----------------------|
| Transactional email | 0 | 8,000 | Lower ≈ free/dev tier (e.g. Resend/SES free allowance); upper ≈ paid plan + at-risk/report fan-out growth |
| WhatsApp Business API (Meta / BSP) | 3,000 | 40,000 | Lower ≈ low assignment volume on Cloud API; upper ≈ higher assigns/reassigns/regenerates + BSP markup + FX |
| Customer inquiry SMS | 500 | 15,000 | Lower ≈ SMS off or very low inquiry volume; upper ≈ SMS enabled + higher daily creates (one SMS per inquiry) + gateway markup |
| **Subtotal messaging** | **3,500** | **63,000** | |

**WhatsApp notes (important):**

- MVP sends WhatsApp mainly on **technician select / reassign / regenerate** (plus copyable fallback if send fails — no extra Meta fee for the fallback UI).
- Meta bills **per message / category / recipient country**; rates change (incl. announced platform updates through 2026). Treat WhatsApp as the **most variable** line.
- From **1 Oct 2026**, Meta has announced broader charging for some previously free in-window utility/service traffic — **re-check the live rate card** before locking an annual ops budget.
- BSPs may add a monthly platform fee and/or markup on top of Meta.

**Customer SMS notes (RC-001):**

- At most **one SMS per inquiry create** when Admin has enabled the feature (default off at go-live).
- Message is a short English acknowledgement with inquiry number + job count; Admin may edit the template.
- SMS failure does not block inquiry create; staff see an in-app warning.
- Per-message gateway fees are client-owned (not in the LKR 650,000 build fee).

**Email notes:**

- Traffic includes: new-job DH mail, at-risk (daily 08:00 Colombo to DH + Admins while eligible), action-triggered staff mail, weekly auto reports, manual report emails.
- In-app notifications are **in your app DB** — no separate SaaS fee.

### 3.3 Contingency (FX + vendor price moves)

| Line item | Lower (LKR/mo) | Upper (LKR/mo) | Why |
|-----------|---------------:|---------------:|-----|
| Contingency / FX buffer | 1,000 | 15,000 | Most vendors invoice in USD; LKR moves; Meta/email/SMS list prices change |
| **Subtotal contingency** | **1,000** | **15,000** | |

### 3.4 Totals

| | Lower range | Upper range |
|--|------------:|------------:|
| Infrastructure | 6,000 | 92,500 |
| Messaging | 3,500 | 63,000 |
| Contingency | 1,000 | 15,000 |
| **Monthly total** | **≈ 10,500 → use planning floor 15,000*** | **≈ 170,500 → use planning ceiling 135,000*** |

\*Rounded **planning bands** for the proposal: **LKR 15,000–28,000** (lower) and **LKR 75,000–135,000** (upper).  
The raw sum of upper line maxima is higher than 135k if every line is maxed at once; that combination is unlikely for early MVP. The **75k–135k** upper band is the realistic “comfortable production” envelope with SMS enabled. The **15k–28k** lower band assumes lean single-stack hosting, low WhatsApp volume, and SMS off or very low.

---

## 4. Scenario examples (same MVP software)

### Lower — lean production (~LKR 15,000–28,000 / month)

- One small VPS or hobby PaaS running API + web  
- PostgreSQL on the same machine (or free/cheap managed tier)  
- No dedicated staging (or staging only when needed)  
- Email mostly within free allowance  
- ~50–200 WhatsApp utility sends / month (assignments)  
- Customer SMS **off** or very low volume  
- Minimal paid monitoring  

### Upper — comfortable production (~LKR 75,000–135,000 / month)

- Separate **production + staging**  
- Managed PostgreSQL with retained backups  
- Paid transactional email  
- Higher assignment/regenerate volume and/or BSP fees  
- Basic error tracking + uptime checks  
- Explicit FX/vendor contingency  

---

## 5. One-time / annual client costs (outside monthly)

| Item | Lower (LKR) | Upper (LKR) | Cadence |
|------|------------:|------------:|---------|
| Domain registration / renewal | 2,000 | 15,000 | Yearly |
| WhatsApp Business verification / template setup time | 0 | 50,000+ | One-time (mostly process; BSP onboarding fees vary) |
| Initial cloud account credits / deposit | 0 | 20,000 | One-time |
| SSL (if not free) | 0 | 15,000 | Yearly (usually unnecessary) |

Meta Business verification itself is typically **process**, not a large Meta “license,” but **BSP onboarding** or agency help can add cost — confirm with the chosen WhatsApp path in Week 1.

---

## 6. What is *not* a client recurring cost from this build

| Item | Who pays |
|------|----------|
| Software design/build (AO-ENG-000 + AO-F-001…012) | Covered by fixed project fee (see MVP budget breakdown) |
| Post-acceptance feature changes | Change requests (new quotes) |
| Support retainer after warranty | Optional separate agreement |
| Staff devices, office internet, WhatsApp on personal phones for copyable fallback | Client operations |

---

## 7. How to use this with the proposal

1. Client budgets **build fee** (fixed) + **monthly ops band** (this document).  
2. Kickoff Week 1: pick vendors → replace ranges with **quoted** monthly totals.  
3. After first full production month: replace WhatsApp/email lines with **actual invoice** averages.  
4. Revisit WhatsApp line before **Oct 2026** Meta pricing changes if still on MVP channels.

**Related:**

- Build fee allocation: `docs/commercial/Assidua-Ops-MVP-budget-breakdown.md`  
- Client proposal: `docs/commercial/Assidua-Ops-MVP-proposal.md`  
- Provider adapters: ADR-004, ADR-005  

---

## 8. Disclaimer

Figures are **indicative planning ranges** for Assidua Ops MVP operations in Sri Lanka, converted at ~LKR 335/USD. They are **not** vendor quotes, not a guarantee of Meta/email/hosting invoices, and not part of the software fixed fee. Always confirm live pricing and Sri Lanka–specific WhatsApp rate cards before signing provider contracts.
