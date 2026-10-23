---
name: adr
description: Make and record an architecture decision (ADR) for Assidua Ops — first use is choosing the tech stack (ADR-001) and hosting (ADR-002), then wiring verify.sh, CI and deploy scripts to match. Use for any decision that changes stack, dependencies, infrastructure or cross-cutting patterns.
argument-hint: <topic, e.g. "stack" | "hosting" | free text>
---

Follow `docs/harness/skill-conventions.md`.

1. **Context**: collect the constraints from the proposal: §12 technology, §4 exclusions (no HA), §3.5 scheduled jobs, §3.6 file storage, §9 backups, §10.5 accounts in the Company's name, Year-1 cost ranges (§6.3), a 4-week solo build, and a 6-month warranty by one developer.
2. **Options**: 2–3 realistic options in the ADR table (`docs/architecture/decisions/ADR-000-template.md`).
   - For **stack**, weigh:
     - type safety end-to-end
     - mature auth/session handling
     - PostgreSQL migrations
     - a background scheduler (08:00 / Monday jobs in Asia/Colombo)
     - file uploads
     - Playwright-testable UI
     - an accessible component library
     - ease of handover to the Company
   - For **hosting**, weigh:
     - LKR monthly cost against the §6.3 ranges
     - managed PostgreSQL + daily backups with 14-day retention
     - region
     - Company-owned billing
     - deploy-from-Actions support
     - persistent file storage
3. Recommend one option and explain why. Use web research for current versions and prices, and cite it.
4. ⛔ Gate: show the ADR draft.
5. On approval:
   - Write `docs/architecture/decisions/ADR-00n-<slug>.md`, with status Accepted.
   - Update `docs/architecture/ARCHITECTURE.md`, the CLAUDE.md **Stack** and **Commands** sections, and `harness.config.json` (`stack` or `hosting`: `decided: true`, `adr`, and `deployScript` for hosting).
   - Create the Jira Task(s) needed to wire tooling.
   - **Stack ADR:** the wiring Task covers:
     - scaffolding the app
     - filling in `scripts/verify.sh` (format → lint → types → unit → integration → build)
     - adding `scripts/format-file.sh`
     - filling in `scripts/e2e.sh` with Playwright + axe-core
     - filling in the tokens and components in `docs/ui/design-system.md`
   - **Hosting ADR:** the wiring Task covers:
     - `scripts/deploy/<target>.sh`
     - environment URLs in the config
     - GitHub environments via `node scripts/harness/github-bootstrap.mjs`
6. Work on a branch `KAN-<task>-adr-<slug>` and ship the ADR through `/review` → `/ship` like any change.

End with the evidence report and **Next →**.
