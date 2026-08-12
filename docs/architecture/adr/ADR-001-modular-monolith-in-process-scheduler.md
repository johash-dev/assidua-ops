# ADR-001: Modular monolith with in-process scheduler

- **ADR ID:** ADR-001
- **Title:** Modular monolith with in-process scheduler
- **Status:** Accepted

## Context

Assidua Ops MVP needs a staff UI, technician public-link UI, HTTP API, PostgreSQL persistence, and scheduled work (daily at-risk at 08:00 Asia/Colombo; weekly report Monday 08:00 Asia/Colombo). Platform rules require a modular monolith: feature-first NestJS modules, Controllers → Services → Repositories → Prisma, no microservices for convenience. MVP volume is expected to be modest; introducing separate worker fleets or queue products would add operational surface without proven need.

## Decision

Deploy **one** NestJS process as the modular-monolith API that also hosts scheduled workers (NestJS cron with explicit `Asia/Colombo` timezone). Deploy **one** Next.js App Router app for staff and public technician-link routes. Persist with managed PostgreSQL via Prisma. Do **not** introduce a queue product, separate notify/report microservices, Redis, or search cluster for MVP. Document a **single-instance scheduler** assumption for MVP; escalate to distributed lock / external scheduler if the API is horizontally scaled later.

Cross-module calls are **service → service** only (no shared repositories across features). Shared primitives only after rule-of-three.

## Alternatives considered

| Alternative | Why not |
|-------------|---------|
| Microservices for notifications and/or reports | Violates modular-monolith constraint; YAGNI for MVP volume |
| Separate worker service + queue (SQS/Rabbit/etc.) | Extra deployables and ops; add when volume or reliability proves need |
| Multiple NestJS processes with independent cron | Duplicate at-risk/report sends under multi-instance without locks |

## Rationale

Smallest footprint that satisfies frozen requirements and Assidua constraints. In-process cron matches NFR-3 calendar behavior without a second product. Evolutionary path (lock / external scheduler / queue) remains open if scale requires it; no speculative infrastructure now.

## Consequences

- **Positive:** One API deployable; simpler local/dev and CI; feature modules stay colocated; no queue/broker cost or failure modes in MVP.
- **Negative / limitations:** Horizontal scale of the API can double-fire cron jobs unless a lock or external scheduler is added later (`ponytail:` single-scheduler assumption).
- **Constraint:** New capabilities default into NestJS feature modules and the existing Next.js app, not new services.

## Requirements affected

- Assidua modular-monolith / stack authority (project README)
- NFR-3 (Asia/Colombo calendar)
- FR-5.2 (at-risk daily schedule)
- FR-6.3 (weekly auto report schedule)
- NFR-1 (notification delivery channels — hosted in-process via adapters)
