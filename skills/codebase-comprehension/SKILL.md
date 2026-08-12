---
name: codebase-comprehension
description: Build focused understanding of an existing repository, feature, dependency path, or user flow before modifying it.
---

# Codebase Comprehension

## Principle

Read enough to understand the change before touching code.

## Procedure

1. Inspect repository structure.
2. Locate the target feature.
3. Trace the relevant entry point.
4. Trace data/control flow.
5. Find related tests.
6. Find similar implementations.
7. Identify boundaries and dependencies.
8. Read only the files needed for confidence.
9. Record uncertainty.

## Search order

```text
feature → route/API entry → service → repository/data → UI/client → tests → shared dependencies
```

## Output

```text
Relevant files:
Execution path:
Data flow:
Existing patterns:
Dependencies:
Authorization:
Tests:
Constraints:
Potential impact:
Unknowns:
```

Never start implementation from a filename alone.
