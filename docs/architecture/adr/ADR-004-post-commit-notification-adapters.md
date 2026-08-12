# ADR-004: Post-commit notification adapters

- **ADR ID:** ADR-004
- **Title:** Post-commit notification adapters
- **Status:** Accepted

## Context

Staff and technicians depend on in-app, email, and WhatsApp channels (NFR-1). Assignment must succeed even when WhatsApp fails (I52 copyable fallback). In-app writes are best-effort with no failure UX (M19). Action-triggered email failures warn the actor (I18); scheduled email is best-effort. Recipients are fixed by role rules, not configurable. Platform rules require decoupled notification providers behind interfaces.

## Decision

After domain services **commit** the business write first:

1. `NotificationOrchestrator.enqueueOrSend(event)` runs **after commit / outside the business transaction**.
2. Resolve recipients from fixed role rules; read `NotificationSetting` for event type where applicable.
3. Deliver via channel adapters:
   - **InAppChannel** — best-effort; no failure UX (M19)
   - **EmailChannel** — action-triggered: warn actor on fail (I18); scheduled: best-effort
   - **WhatsAppChannel** — assignment/regenerate only; failure must **not** roll back assignment; API includes `copyableText` identical to the intended WhatsApp body (I52)
   - **SmsChannel** — customer inquiry acknowledgement only (`CUSTOMER_INQUIRY_CREATED`); failure must **not** roll back inquiry create; actor in-app warning (RC-001 / I58 / ADR-008)
4. Providers stay behind interfaces (`WhatsAppSender`, `SmsSender`, existing email adapter). No business logic in SDK calls.
5. Adapters may use short **bounded** internal retries for transient failures; no user-visible multi-retry product and no claimed business durability SLA (NFR-1 / M42 open as implementation constraint only).

**Assignment/link transaction boundary:** persist assignment + link, commit, then WhatsApp. WhatsApp failure never rolls back the assignment.

**Inquiry create transaction boundary:** persist inquiry (with `inquiryNumber`) + jobs, commit, then optional customer SMS. SMS failure never rolls back the create (FR-1.9).

Weekly/report email is always-on operational mail under NFR-1 unless a later requirements change adds a toggle (settings apply to staff in-app/email event types per FR-7.3). Customer SMS uses a separate Admin enable + template setting (FR-7.4), default off.

## Alternatives considered

| Alternative | Why not |
|-------------|---------|
| Send WhatsApp inside the same DB transaction as assignment | Would force rollback on provider failure; violates I52 |
| Queue product for all notifications in MVP | YAGNI; see ADR-001 |
| Configurable recipients | Fixed by confirmed notification rules |
| Invent product-level retry/backoff SLA | NFR-1/M42 intentionally open; keep adapter-bounded only |

## Rationale

Separating commit from delivery preserves assignment durability and matches I18/I52/M19. Adapter interfaces allow provider swaps (including development-tier choices in ADR-005) without changing domain services.

## Consequences

- **Positive:** Assignment/status remain correct when messaging fails; providers are swappable; CI can fake adapters.
- **Negative / limitations:** At-most-once / best-effort semantics for some channels; actors may need copyable fallback; no durable outbox product in MVP.
- **Constraint:** Domain modules must not call WhatsApp/email/SMS SDKs directly; go through orchestrator/adapters after commit.

## Requirements affected

- FR-1.5, FR-1.7–1.9, FR-2, FR-5.2, FR-6.3, FR-7.3, FR-7.4
- NFR-1, NFR-8
- I18, I52, M19, M32, I58 / RC-001
- Confirmed Notifications behavior
- Related: ADR-001 (in-process hosting), ADR-005 (dev-tier providers), ADR-008 (customer SMS)
