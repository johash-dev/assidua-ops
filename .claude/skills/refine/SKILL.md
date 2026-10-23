---
name: refine
description: Tighten one Jira story until it meets the Definition of Ready — missing acceptance criteria, negative/permission cases, edge cases, audit events, UI states, open decisions. Use before /start when a story is vague or labelled needs-decision.
argument-hint: <AO-key>
---

Follow `docs/harness/skill-conventions.md`.

1. Fetch the issue, its epic, and any linked issues. Read its Scope ref section and the business rules it cites.
2. Score it against the Definition of Ready (`docs/harness/jira-model.md`) and list the gaps.
3. Draft the improved description. Specifically add:
   - Asia/Colombo date-boundary cases (where dates are involved)
   - other-department access attempts
   - deactivated-user behaviour
   - concurrency (e.g. reference sequence, double assignment)
   - empty/error UI states
4. If a decision belongs to Johash or the client (e.g. which roles may cancel a job), ask it inside the gate. Don't invent the answer.
5. ⛔ Gate: show a before/after of the story, plus any decisions needed.
6. On approval:
   - update the issue
   - remove `needs-decision` if it is resolved
   - transition it to `Ready` if it now meets the DoR
   - record any decisions in `roles-and-permissions.md` / `business-rules.md` (add new BR-n)

End with the evidence report and **Next →**.
