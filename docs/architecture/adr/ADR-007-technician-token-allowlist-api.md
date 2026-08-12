# ADR-007: Technician token allow-list API only

- **ADR ID:** ADR-007
- **Title:** Technician token allow-list API only
- **Status:** Accepted

## Context

Technicians have no staff login in MVP. They use shareable links (`/t/[token]`) to view an allow-listed job projection and submit status/notes (FR-3, I27). NestJS is the authorization source of truth (NFR-4). If the Next.js technician UI loaded job data via direct DB, Prisma, or RSC bypass, allow-list and token validity rules could be skipped or duplicated incorrectly.

## Decision

- **No** technician authenticated app / mobile login in MVP.
- Technician authentication is **solely** by shareable token (see ADR-003).
- NestJS token-authenticated endpoints return only the **I27 allow-list DTO** (hide primary address, email, cancel reason, audit, etc.).
- Next.js `/t/[token]` obtains job data **only** through those NestJS endpoints — **no** direct DB, Prisma, or RSC data bypass.
- Invalid/expired: dedicated message (M52); no job payload.

Staff UI remains cookie/session authenticated against NestJS; UI enforces nothing security-critical.

## Alternatives considered

| Alternative | Why not |
|-------------|---------|
| Technician authenticated app (login) | Out of scope for MVP |
| Next.js RSC / direct Prisma for tech link pages | Bypasses NestJS token auth and I27 projection; violates NFR-4 posture |
| Broader tech payload “for convenience” | Violates I27 allow-list |

## Rationale

Token + allow-list API keeps a single security boundary for technician access, matches FR-3/NFR-4/I27, and avoids a second identity system (ADR-002 remains staff-only).

## Consequences

- **Positive:** One enforcement point for tech data exposure; staff and tech auth stay separate; Playwright can exercise the public link flow against real API behavior.
- **Negative / limitations:** Tech UX depends on API availability; no offline tech app.
- **Constraint:** Any new technician field must pass I27 allow-list review before appearing on token endpoints or `/t/[token]` UI.

## Requirements affected

- FR-2, FR-3
- NFR-4, NFR-5
- I27 (allow-list DTO)
- M52 (invalid/expired UX)
- Auth table (tech = token scope single job)
- Related: ADR-003 (link hashing/validity), ADR-002 (staff identity separate)
