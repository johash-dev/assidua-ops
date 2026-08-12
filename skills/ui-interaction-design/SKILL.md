---
name: ui-interaction-design
description: Produce a minimal staff-UI contract (screens, flows, role chrome, states) from a feature spec before frontend implementation.
---

# UI Interaction Design

## Purpose

Decide how users move through a feature in the UI before Builder implements screens.

## Applicability

Use after a feature specification exists and before PLAN/IMPLEMENT when any staff-facing or customer-facing UI is in scope.

Skip for non-UI slices (schedulers, adapters, pure domain services) and record the skip.

## Procedure

1. Read the feature spec (especially user-visible behavior, authorization, error states, out of scope).
2. Search the repo for existing screens, layouts, and shared UI patterns to reuse.
3. Inventory **screens/routes** required by this feature only.
4. Describe **primary flows** as short step lists (who → action → next screen/result).
5. Build a **role matrix**: visible vs actionable vs hidden per role (Admin, DH, FD, Coordinator, tech link, etc. as applicable).
6. Fill a **states matrix** for each primary screen: empty, loading, validation, error, success — only states implied by AC or error sections.
7. Capture **copy constraints** from requirements; use placeholders where copy is undecided; do not invent marketing tone.
8. List **reuse** and **out of UI scope**.
9. Escalate undecided business behavior; do not invent it in the UI contract.
10. Write the UI contract into the feature spec.

## Constraints

- Minimal: fewest screens that satisfy the spec.
- Visual system is **ADR-009** (Tailwind + shadcn/ui). Do not invent a parallel design system in the contract.
- No speculative screens.
- UI is not the authz boundary.
- Deferred requirements gates stay gated (placeholder UI only when the spec already allows it).

## Output (UI contract section)

```text
## UI contract

Screens / routes:
Primary flows:
Role matrix:
States:
Copy constraints:
Reuse:
Out of UI scope:
```

## Validation

- Every acceptance criterion that implies UI is covered by a screen or flow step.
- Every role in the spec’s authorization table has matching visible/actionable treatment.
- No screen exists solely for polish or future features.
- Builder can implement without inventing navigation or empty/error behavior.

## Limitations

Does not replace visual design work when the human explicitly requests mockups or brand systems. Does not invent APIs or business rules.
