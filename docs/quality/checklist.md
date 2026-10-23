# Quality Checklist

Used by `/review` (the `reviewer` agent) and by the merge gate. This list is derived from the AI-engineering best-practice and code-quality research in `Harness Setup Documents/`.
- **Blocking** items stop the merge.
- **Advisory** items are reported but don't block.

## Blocking
**Requirements & scope**
- [ ] Every AC in the Jira story is demonstrably met, and each one maps to a test or an explicit manual check.
- [ ] Every changed file and significant change traces to an AC or a necessary implementation detail. No unrelated refactors.
- [ ] Nothing outside [approved-scope.md](../scope/approved-scope.md) was added.

**Correctness**
- [ ] No invented APIs, config options or library methods. Each one is verified against installed versions.
- [ ] Error handling neither swallows nor hides failures. The user sees what happened and what to do next.
- [ ] Time handling uses Asia/Colombo at the edges and UTC in storage. Date-boundary cases are tested.

**Security**
- [ ] Authorization is enforced server-side for every new endpoint/action, and has a negative test (wrong role, other department, deactivated user).
- [ ] Technician-link endpoints expose only their one job, and expired or revoked tokens are rejected.
- [ ] Inputs are validated at the boundary. Uploads are checked by content type and size (BR-9).
- [ ] No secrets, tokens or personal data in code, logs or fixtures.
- [ ] Audit events from §3.8 are written for the actions this change touches, and the log stays append-only.

**Tests**
- [ ] Tests assert observable behaviour, not implementation details. Failure cases are included.
- [ ] Tests were not weakened, skipped or deleted to get green.
- [ ] The reported results match the commands actually run (the output is quoted).

**Data**
- [ ] Migrations are reversible or have a documented rollback, and are safe on existing data.

## Advisory
- [ ] Existing abstractions were reused. No duplicate helpers, no needless wrappers.
- [ ] No new dependency without a stated reason, and the lockfile is updated.
- [ ] Code is understandable without the generating model ("would I own this in 6 months?").
- [ ] Mutation-test critical logic: authorization, reference numbering, deadline and report calculations.
- [ ] Comments explain *why*, not *what*.

## UI (stories labelled `ui`, checked by `ui-reviewer`)
- [ ] Uses design-system tokens and components only ([design-system.md](../ui/design-system.md)).
- [ ] All states are present: loading, empty, error, success, disabled.
- [ ] WCAG 2.2 AA: keyboard path, visible focus, labels, contrast, target size ≥ 24px, error identification.
- [ ] Screenshots at 1280px and 375px, with no overflow or overlap.
- [ ] Destructive actions (cancel job, deactivate user) have a confirmation step that states the consequence.
- [ ] The AI review is advisory. Johash's visual check at the merge gate is the human gate.
