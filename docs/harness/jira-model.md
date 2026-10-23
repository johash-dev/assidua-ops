# Jira Model

Project key and site are in `harness.config.json`. The harness owns this structure, so keep it in sync with `scripts/harness/jira-bootstrap.mjs`.

## Hierarchy
- **Epic** = a capability package: Foundation, §3.1 … §3.9, Handover.
- **Story** = one vertical slice and one reviewable PR (aim for ≤ ~400 changed lines; split anything bigger).
- **Task** = non-user-facing work (ADR, CI, infra).
- **Bug** = a defect. **Sub-task** is used only when a story genuinely needs a split PR. Prefer splitting the story instead.

## Components
`customers`, `staff-access`, `inquiries-jobs`, `technicians`, `deadlines-notifications`, `attachments`, `reporting`, `audit`, `handover`, `platform`

## Labels
- Scope (exactly one): `scope:approved` | `scope:cr` | `warranty`
- Flags: `ui`, `security`, `migration`, `needs-decision`

## Workflow
```
To Do → Ready → In Progress → In Review → Ready for QA → In QA → Ready for UAT → In UAT → Ready for Prod → Done
                      ↘ Blocked (from any; returns to prior)   QA/UAT failure → In Progress
```
| Transition | Made by |
|---|---|
| To Do → Ready | `/breakdown` or `/refine` after ⛔ approval (story meets Definition of Ready) |
| Ready → In Progress | `/start` |
| In Progress → In Review | `/ship` (PR opened) |
| In Review → Ready for QA | `/ship` after merge |
| Ready for QA → In QA → Ready for UAT | `/qa` |
| Ready for UAT → In UAT | `/release-uat` |
| In UAT → Ready for Prod | `/uat-intake` when the client accepts, or on deemed acceptance |
| Ready for Prod → Done | `/release-prod` |

## Definition of Ready
- User story, plus a **Scope ref** (`§x.y` or `CR-###`).
- Acceptance criteria in Given/When/Then, including at least one negative/permission case.
- Edge cases, non-goals, cited business rules (`BR-n`), the audit events it produces.
- For `ui` stories: the screens and states (loading / empty / error / success / disabled).
- Small enough for one reviewable PR. No time estimate is required.

## Definition of Done
- AC are met, with evidence from `verify.sh` output.
- `/review` has no unresolved blocking findings.
- PR merged; deployed to QA; `/qa` passed.
- Jira comment carries the PR link, test evidence and the QA result.

## Story description template
```
**As a** <role> **I want** <capability> **so that** <outcome>
**Scope ref:** §3.x   **Business rules:** BR-n
**Acceptance criteria**
1. Given … When … Then …
**Edge cases:** …
**Non-goals:** …
**Audit events:** …
**UI states:** loading | empty | error | success | disabled
**Test strategy:** unit / integration / e2e — what each proves
```

## Bug template
```
**Environment:** qa | staging | production   **Version:** x.y.z
**Steps to reproduce** / **Expected** / **Actual** / **Evidence**
**Classification:** defect | non-blocking (§7.4 reason) | CR
**Priority (§8):** Critical | High | Medium | Low  **Linked story:** AO-n
```

## Versions, ordering and priority
- Priority mapping (§8 → Jira defaults): Critical → Highest, High → High, Medium → Medium, Low → Low.
- Fix versions: `1.0.0` (MVP), `1.0.x` (warranty patches). A version is a release milestone, not a date.
- **No sprints and no delivery dates.** Work is pulled continuously: board rank (set by `/breakdown` in dependency order, following the build-order phases in `approved-scope.md`), then priority. The harness never assigns issues to sprints.
