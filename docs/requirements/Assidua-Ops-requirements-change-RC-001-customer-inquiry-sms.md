# RC-001 — Customer inquiry SMS + inquiry number

**Change ID:** RC-001  
**Parent Feature ID:** AO-MVP-001  
**Date:** 2026-08-13  
**Status:** **HUMAN APPROVED (2026-08-13)**  
**Authority:** Adopted into `Assidua-Ops-requirements-baseline.md` (Decision 115 / I58). This RC remains the narrative change record.  
**Cascade:** Architecture, specs AO-F-005 / AO-F-009 (+ breakdown), and commercial docs must be updated before PLAN/IMPLEMENT of this capability.  
**Commercial path:** Amend MVP now (pre-sign) — Path A.

---

## Objective

On successful inquiry create, optionally send **one** SMS to the customer acknowledging receipt with the inquiry number and job count; introduce a **customer-facing inquiry number** for SMS and staff UI.

---

## Confirmed behavior

1. **Trigger:** After a successful **inquiry create** (atomic multi-job create). **One SMS per inquiry**, regardless of how many jobs are in that inquiry.
2. **Not on:** Later edits, follow-up inquiries, assignment, lifecycle, or any other event. **No manual resend** in MVP.
3. **Destination:** Customer **phone** (required customer field). Sites have no phone.
4. **Failure:** If SMS send fails (or cannot be attempted), the inquiry/jobs **still persist**. Show an **in-app warning to the actor** (same pattern as action-triggered staff email failure).
5. **Inquiry number:** On every successful inquiry create, assign a **customer-facing inquiry number** (even if SMS is disabled). Show it in **staff UI**. Format: **`YYYYMMDD-NNN`** where the date and daily sequence reset use **Asia/Colombo**, and `NNN` is a zero-padded daily sequence starting at `001` (e.g. `20260813-001`).
6. **SMS body:** English only in MVP. Admin-editable free-text template. Saving the template **requires** placeholders `{INQUIRY_NUMBER}` and `{JOB_COUNT}` to be present. System substitutes them at send time. **Seed / default template:**
   - `Thank you. We received your inquiry {INQUIRY_NUMBER} with {JOB_COUNT} job(s).`
7. **Admin controls:** Admin may **enable/disable** this customer SMS (toggle). **Default: off** (no SMS until Admin enables). Admin may edit the template under the rules above.
8. **Content scope:** Acknowledgement + inquiry number + job count only. No per-job category, site, issue, or priority in the SMS.

---

## Functional requirements (delta)

- **FR-1.7** On successful inquiry create, assign a unique customer-facing inquiry number `YYYYMMDD-NNN` (Asia/Colombo date + daily sequence). Display the number in staff UI. Number is assigned whether or not SMS is enabled.
- **FR-1.8** When the Admin customer-SMS toggle is **on**, after successful inquiry create, send **exactly one** SMS to the customer phone using the current Admin template with `{INQUIRY_NUMBER}` and `{JOB_COUNT}` substituted (`JOB_COUNT` = number of jobs created in that inquiry). When the toggle is **off**, do not send SMS.
- **FR-1.9** SMS send failure must not roll back inquiry/job create; show an in-app warning to the creating actor.
- **FR-7.4** Admins may enable/disable customer inquiry SMS (default **off**) and edit the English SMS template; template save is rejected unless both `{INQUIRY_NUMBER}` and `{JOB_COUNT}` appear in the text.

---

## Non-functional requirements (delta)

- **NFR-1 (amend):** Business-required channels add **SMS for customer inquiry acknowledgement** when enabled, in addition to in-app, email, and WhatsApp for technician links. Reliability/retry beyond “fail → actor in-app warning; create succeeds” remains unspecified (same open stance as other channels).
- **NFR-8** Customer SMS delivery requires an SMS provider/process (provider not chosen in requirements — architecture).

---

## Acceptance criteria (delta)

- Given a successful multi-job inquiry create with SMS toggle **on**, when create completes, then **exactly one** SMS is attempted to the customer phone and the body contains the inquiry’s `{INQUIRY_NUMBER}` and the correct `{JOB_COUNT}`.
- Given a successful inquiry create with SMS toggle **off**, when create completes, then **no** SMS is sent, and the inquiry still has a customer-facing inquiry number visible in staff UI.
- Given SMS toggle **on** and SMS provider failure, when create completes, then inquiry/jobs exist and the actor sees an in-app warning.
- Given Admin saves an SMS template missing `{INQUIRY_NUMBER}` or `{JOB_COUNT}`, when saving, then the save is rejected.
- Given Admin enables the toggle (from default off), when a later inquiry is created, then SMS is attempted per FR-1.8.
- Given an existing inquiry, when staff look for a resend-SMS action, then none exists in MVP.
- Given two inquiries created on the same Asia/Colombo calendar day, when inspecting numbers, then they share the same `YYYYMMDD` prefix and have distinct ascending `NNN` values.

---

## Authorization (delta)

| Capability | Admin | DH | Front desk | Coordinator | Technician link |
|------------|-------|----|------------|-------------|-----------------|
| Configure customer SMS toggle + template | Yes | No | No | No | No |
| Trigger automatic customer SMS on create | Via create when toggle on | Via create when toggle on (own-dept create rules) | Via create when toggle on | No | No |

---

## Out of scope (this change)

- Multi-language SMS
- Manual resend
- Per-job detail in SMS (category, site, issue, priority)
- Customer portal / SMS replies / two-way messaging
- Choosing the SMS vendor (architecture)
- Inventing phone-format validation beyond existing deferred M45
- Audit rules for SMS send attempts or template/toggle edits (not decided — **do not invent**; parallel to notification-settings audit exclusion unless a later change requires them)

---

## Assumptions

1. Inquiry number is always assigned on create (staff UI + SMS), independent of the SMS toggle.
2. Daily sequence padding is three digits (`001`…) as in the grill example `20260813-001`.
3. Destination is customer phone only (no site phone field exists).
4. Provider, credentials, per-segment billing, and exact max template length are implementation/architecture constraints; business rule is single English template with required placeholders.

---

## Open for architecture (not product decisions)

1. SMS gateway / provider selection and credential configuration.
2. How daily sequence uniqueness is enforced under concurrency.
3. Whether template/toggle changes or SMS attempts appear in audit (escalate for requirements if product needs them).
4. Template length / provider character limits (truncate vs reject at save — prefer reject invalid template at Admin save if over a documented provider-safe max once known).

---

## Cascade after human approval

1. Amend baseline Decision **115 / I58** and related FR/AC/NFR sections (mirror this RC).
2. Architecture: introduce SMS adapter; revise “SMS gateway not introduced”; ADR as needed.
3. Specs: AO-F-005 (inquiry number + emit SMS on create), AO-F-009 (toggle + template settings); update `AO-MVP-001-feature-breakdown.md`.
4. Commercial: proposal scope, budget note, recurring costs SMS line — **done (2026-08-13)**.
5. Human confirm architecture + F-005/F-009 amends — **done (2026-08-13)**; then PLAN/IMPLEMENT.

---

## Grill trace (2026-08-13)

| Q | Topic | Answer |
|---|--------|--------|
| 1 | SMS failure | Create succeeds + actor in-app warning |
| 2 | Content shape | Ack + brief summary (mix A/B) |
| 3 | Summary fields | Inquiry reference/id + job count only |
| 4 | Reference type | New short customer-facing inquiry number + staff UI |
| 5 | Number format | Date-based daily sequence `YYYYMMDD-NNN` |
| 6 | Toggle | Admin enable/disable |
| 7 | Language | English only for MVP |
| 8 | Seed text | `Thank you. We received your inquiry {INQUIRY_NUMBER} with {JOB_COUNT} job(s).` |
| 9 | Default + template | Default **off**; Admin configures template |
| 10 | Template rules | Free text; both placeholders required |
| 11 | Resend | Create-time only |
| 12 | Commercial | Amend MVP now (Path A) |
