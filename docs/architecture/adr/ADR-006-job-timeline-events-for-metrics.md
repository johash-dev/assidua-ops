# ADR-006: Job timeline events for metrics

- **ADR ID:** ADR-006
- **Title:** Job timeline events for metrics
- **Status:** Accepted

## Context

Performance reports (FR-6.3) need volume events, On Hold duration, TTR cycle raw data, and related intervals. Audit entries (FR-6.2, I17) are the human-readable compliance view with required event types and DH scoping. Parsing free-text or compliance audit rows for metric intervals would couple reporting to audit wording and make duration/TTR computation brittle. I54 (TTR aggregate shape/unit) remains deferred — architecture must store raw cycles without locking avg/median/population.

## Decision

Persist an append-only **`JobTimelineEvent`** stream (internal operational events) recording at least: Created, Assigned, status transitions, On Hold enter/exit timestamps, Reopen, Close, Cancel — so `reports` can compute metrics over Job + JobTimelineEvent (+ Technician snapshots) as pure functions.

Keep **`AuditEntry`** as the separate append-only compliance log for I17 (and exclusions per I45). Do **not** derive report intervals by parsing audit prose.

For TTR (I49 on auto + manual): store/first-class compute:

- first Assigned → first Resolved interval
- latest Assigned → following Resolved after reopen

…as raw cycle data. Report DTO leaves `timeToResolve: TBD_PENDING_I54`; do **not** invent the aggregate shape until I54 is decided.

Manual report artifacts: retain **latest** per requester (prefer DB storage for MVP size).

## Alternatives considered

| Alternative | Why not |
|-------------|---------|
| Compute all report intervals by parsing `AuditEntry` | Couples metrics to compliance text; brittle for On Hold/TTR |
| Soft “Reopened” status for cycles | Rejected by requirements (action → Assigned/New) |
| Multi-week in-app report archive | Latest manual only; auto is email-only (I36) |
| Lock TTR avg/median/unit now | I54 deferred; would invent product |

## Rationale

Separating operational timeline from compliance audit gives reports a stable event source without overloading audit or inventing deferred TTR aggregates. Matches confirmed reporting behavior while leaving I54 gated.

## Consequences

- **Positive:** Clear metric inputs; audit stays scoped to I17/I45; I54 can land later on raw cycles.
- **Negative / limitations:** Two append-only streams to write on lifecycle changes; writers must keep both consistent where required.
- **Constraint:** Report engine reads timeline (+ jobs), not audit text; do not ship invented TTR aggregates before I54.

## Requirements affected

- FR-6.2, FR-6.3
- NFR-2 (audit)
- I17, I45 (audit include/exclude)
- I30, I36, I46–I49 (reports)
- I54 (deferred TTR shape — explicit gate)
- I55 (deferred cancel-reason-edit audit — unrelated but audit-adjacent gate)
- B9
