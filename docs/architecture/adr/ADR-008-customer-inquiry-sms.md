# ADR-008: Customer inquiry SMS + inquiry number

- **ADR ID:** ADR-008
- **Title:** Customer inquiry SMS adapter + Colombo daily inquiry numbers
- **Status:** Accepted
- **Requirements:** RC-001 / I58; FR-1.7–1.9; FR-7.4; NFR-1; NFR-8
- **Confirmed:** Architecture amend human-confirmed 2026-08-13

## Context

RC-001 requires a customer-facing inquiry number on every inquiry create and an optional one-shot customer SMS after create. Architecture previously stated SMS gateway was not introduced. Staff notifications already use post-commit adapters (ADR-004). SMS must not roll back inquiry create; failure warns the actor (same pattern as action-triggered email).

## Decision

1. **Inquiry number (jobs module, inside create transaction)**  
   - Persist `Inquiry.inquiryNumber` as unique string `YYYYMMDD-NNN` (Asia/Colombo date; `NNN` zero-padded daily sequence from `001`).  
   - Allocate via a small `InquiryNumberCounter` row keyed by Colombo calendar date (`date` → `lastSeq`), updated in the **same DB transaction** as inquiry create (row lock / upsert) so concurrent creates do not collide.  
   - Always assign whether or not SMS is enabled. Staff UI displays `inquiryNumber`.

2. **Customer SMS (notifications module, after commit)**  
   - Add `SmsChannel` + `SmsSender` interface behind `NotificationOrchestrator` (same post-commit pattern as ADR-004).  
   - Event: `CUSTOMER_INQUIRY_CREATED` (inquiry-scoped; **one** send per inquiry).  
   - Settings (Admin-only, separate from staff in-app/email toggles):  
     - `customerSmsEnabled` boolean — **default false**  
     - `customerSmsTemplate` text — seed `Thank you. We received your inquiry {INQUIRY_NUMBER} with {JOB_COUNT} job(s).`; save rejected unless both placeholders present.  
   - On create (jobs): after commit, if enabled, orchestrator sends SMS to **customer phone** with substituted template; on failure return/surface **in-app warning to actor**; create remains committed.  
   - **No** manual resend API/UI in MVP.  
   - SMS toggle/template changes and send attempts are **not** required in MVP audit (parallel to I45 notification-settings exclusion) unless a later RC says otherwise.

3. **Providers**  
   - Interface: `SmsSender.send({ toPhone, body }) → { ok } | { ok:false, error }`.  
   - **Dev/CI:** fake / log-only adapter (no live SMS in CI).  
   - **Prod:** env-configured SMS gateway (illustrative: Twilio, Vonage, or a local Sri Lanka SMS aggregator) — swap via config only; no business logic in SDK.  
   - Extend ADR-005 style: development tier must not send to real customers by default.

4. **Does not change:** staff `JOB_*` in-app/email toggles; WhatsApp assignment path; modular monolith / in-process hosting.

## Alternatives considered

| Alternative | Why not |
|-------------|---------|
| Use internal UUID as customer-facing id | Rejected by RC-001 (date-based short number required) |
| Send SMS inside inquiry create transaction | Would force rollback on provider failure; violates FR-1.9 |
| Separate microservice / queue for SMS | YAGNI; ADR-001 |
| Per-job SMS | Violates one-SMS-per-inquiry |
| Invent phone E.164 validation | M45 deferred |

## Consequences

- **Positive:** Matches RC-001; reuses ADR-004 post-commit pattern; provider-swappable; create durability preserved.  
- **Negative:** New paid/external dependency (SMS) and ops credentials; daily counter needs careful concurrency.  
- **Constraint:** Domain modules must not call SMS SDKs directly.

## Related

- ADR-004 (post-commit adapters)  
- ADR-005 (dev-tier messaging — extend with SMS fake)  
- Specs: AO-F-005, AO-F-009  
