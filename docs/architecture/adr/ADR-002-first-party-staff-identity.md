# ADR-002: First-party staff identity

- **ADR ID:** ADR-002
- **Title:** First-party staff identity
- **Status:** Accepted

## Context

Staff must authenticate with exactly one role (Front Desk, Coordinator, Department Head, Admin). Authorization is server-side in NestJS. The baseline does not require SSO. Third-party identity products (Clerk, Auth0, etc.) typically add recurring seat cost and couple login to an external vendor for a greenfield MVP that only needs email/password (or magic link) staff accounts.

## Decision

Implement **first-party** staff identity in the `identity` module (email/password or magic link). Prefer this over a paid IdP subscription unless operations later requires SSO (not in the frozen baseline). Session cookies for the staff Next.js app; NestJS remains the authorization source of truth (NFR-4).

Technician access is **not** staff identity — see ADR-007.

## Alternatives considered

| Alternative | Why not |
|-------------|---------|
| Clerk / Auth0 / similar hosted IdP | Recurring seat subscription not justified by baseline; avoid until SSO is a real ops requirement |

## Rationale

Keeps cost and coupling low while fully covering FR-6.1 / FR-7.1 staff auth and the Auth capability table. IdP can be revisited if SSO becomes required without changing job/domain modules.

## Consequences

- **Positive:** No IdP seat fees; identity schema and sole-DH / role rules stay in-app; secrets limited to app session/crypto config.
- **Negative / limitations:** Team owns password/session security, reset flows, and any future SSO migration.
- **Constraint:** Staff auth lives in `identity`; do not scatter auth providers into feature modules.

## Requirements affected

- FR-6.1, FR-7.1
- I44 / I50 (Admin ≠ DH; exactly one role)
- I34 / I38 (exactly one DH per department; replacement transaction)
- Auth table / M5 capability matrix
- NFR-4 (server-side authorization)
- M35 (go-live seed: three DHs)
