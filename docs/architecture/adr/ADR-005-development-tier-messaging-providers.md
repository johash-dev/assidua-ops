# ADR-005: Development-tier messaging providers

- **ADR ID:** ADR-005
- **Title:** Development-tier messaging providers
- **Status:** Accepted

## Context

MVP requires WhatsApp and transactional email behind adapters (ADR-004). Production Meta WhatsApp (verification, templates, paid messaging) and production SMTP/transactional email are cost- and compliance-impacting. During the current development phase the team needs to exercise adapters without accidental real-user messaging, premature Business Verification, or unnecessary paid production spend. Frozen business requirements and adapter architecture must not change.

## Decision

**Environment/provider configuration only** (adapters unchanged):

| Channel | Development choice | Limitation |
|---------|--------------------|------------|
| WhatsApp | Meta Cloud API **Developer Sandbox / Test Number**; temporary access tokens; recipients restricted to **pre-verified** developer/tester numbers | No general-user messaging until production credentials + verification/templates |
| Email (local) | **Mailtrap Fake SMTP** via environment variables | Not real-recipient delivery |
| Email (staging / live checks) | **Resend** developer/free tier | Subject to free-tier quotas/policies |

- Credentials are **environment-specific** and must **never** be committed.
- Production WhatsApp still requires production credentials and applicable verification/template/compliance; production email remains an env-configured swap (SES / Postmark / Resend / SendGrid, etc.) behind the same email adapter.
- Verify Meta/Resend/Mailtrap limits and policies before production cutover.

This does **not** change notification event types, recipients, or business rules.

## Alternatives considered

| Alternative | Why not |
|-------------|---------|
| Production Meta verification / paid WhatsApp during development | Premature compliance and cost; adapter already allows later prod swap |
| Real SMTP / production email from local machines | Risk of accidental real-recipient delivery |
| New notification providers or adapter patterns for “dev only” | Unnecessary; configure existing `WhatsAppSender` and email adapter |

## Rationale

Minimizes development cost and accidental outbound messaging while preserving the approved adapter boundary for a clean production cutover. Explicitly recorded so implementation and ops do not treat sandbox/Mailtrap/Resend free tier as the production design.

## Consequences

- **Positive:** No extra paid integration cost during development (subject to current free/developer limits); safer local email inspection; no premature Meta Business Verification.
- **Negative / limitations:** WhatsApp testing limited to permitted tester numbers; quotas/policies may change; production still needs full credentials/compliance work.
- **Constraint:** Swap providers via env/config only; do not fork business notification logic per environment.

## Requirements affected

- FR-2; NFR-1 (channels remain mandatory; delivery providers are env-configured)
- I18, I52, M19 (failure/warning/fallback semantics unchanged)
- External services cost notes in approved architecture
- Related: ADR-004 (adapter + post-commit model)
