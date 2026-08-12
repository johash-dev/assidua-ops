# ADR-003: Hashed technician shareable links

- **ADR ID:** ADR-003
- **Title:** Hashed technician shareable links
- **Status:** Accepted

## Context

Technicians receive WhatsApp (or copyable) shareable links and act on a single job without staff login (FR-2, FR-3, NFR-5). Links can be forwarded; residual leakage risk is accepted in the baseline and mitigated by expiry and revoke only. Storing the raw token in the database would expand blast radius if the DB is compromised.

## Decision

- Generate a **≥128-bit cryptographically random** token; persist **hash only** (e.g. SHA-256); the URL carries the raw token once.
- Validity: link is current **and** not revoked **and** `now < issuedAt + 10 days` **and** job status ∉ {Closed, Cancelled}.
- Reassign, same-tech regenerate, and explicit regenerate: revoke previous current link, issue new, attempt WhatsApp.
- Invalid/expired responses use the fixed intent message (M52) and **no** job payload.
- Owned by the `links` module (issue / hash / validate / revoke / expire).

## Alternatives considered

| Alternative | Why not |
|-------------|---------|
| Store raw share tokens in the database | Weaker if DB is compromised; conflicts with NFR-5 posture |
| Longer-lived or non-revoking links | Increases forward/leak exposure beyond approved expiry + revoke model |
| Extra product controls beyond expiry/revoke | Not in baseline; do not invent |

## Rationale

Hash-at-rest plus 10-day expiry and revoke-on-reassign/close/cancel is the approved security model for technician links. It meets NFR-5 without inventing controls outside the frozen requirements.

## Consequences

- **Positive:** DB leak of hashes does not yield usable URLs; revoke/regenerate has a clear lifecycle; single “current” link per job is enforceable.
- **Negative / limitations:** Forwarded links remain usable until expiry/revoke; phone may still appear on the page (baseline residual risk).
- **Constraint:** Never log or persist raw tokens after issue; validation always compares hash of presented token.

## Requirements affected

- FR-2.4, FR-3
- NFR-5
- I42 / I52 (link body / copyable fallback)
- M52 (invalid/expired message)
- Related: ADR-007 (token auth + allow-list DTO)
