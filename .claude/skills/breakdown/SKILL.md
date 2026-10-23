---
name: breakdown
description: Break a capability package (proposal §3.x, an epic, or an approved CR) into Jira epics and right-sized user stories with acceptance criteria, edge cases, non-goals, business rules, audit events, UI states and test strategy, then create them in Jira after approval. Use when the backlog lacks stories for upcoming work.
argument-hint: <§3.x | epic name/key | CR-###>
---

Follow `docs/harness/skill-conventions.md` and `docs/harness/jira-model.md`.

1. **Source**: read the target section of `docs/scope/approved-scope.md` (or the approved CR file), plus the business rules and roles it touches. Search Jira for existing epics and stories on it, so you don't create duplicates.
2. **Slice vertically.** Each story should be:
   - one user-observable capability
   - ≤ 1 day of work
   - one PR
   - testable at a public boundary

   Order the stories by dependency (e.g. the data model + Admin CRUD before the flows that use it). Put enabling tech work in Tasks.
3. **Write each story** using the template in `jira-model.md`:
   - AC in Given/When/Then, including at least one permission-negative case and one invalid-input case
   - the BR-n it cites
   - the §3.8 audit events it produces
   - UI states, for `ui` stories
   - non-goals that stop scope creep
4. **Self-check before showing it:**
   - every bullet of the source § is covered by some story
   - nothing beyond the § was added
   - any open role/permission question is marked `needs-decision` and listed
5. ⛔ Gate. Show a table: title, component, labels, estimate, sprint (W1–W4 per §2), plus the full text of each story. Options: Approve all / Edit some / Stop.
6. **On approval**, create the items in Jira:
   - the epic, if missing
   - the stories, linked to the epic, with components, labels (`scope:approved` | `scope:cr`), fixVersion `1.0.0` and the sprint
   - stories meeting the Definition of Ready are transitioned to `Ready`
   - `needs-decision` stories stay in `To Do`
7. Record any decisions Johash made at the gate in `docs/product/roles-and-permissions.md` or `business-rules.md`.

End with the evidence report (the created keys) and **Next →**.
