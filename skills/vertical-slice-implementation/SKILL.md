---
name: vertical-slice-implementation
description: Implement one complete business capability end-to-end using the project's feature-slice delivery model.
---

# Vertical Slice Implementation

The project delivers one vertical business capability at a time.

Typical order:

```text
backend contract/business logic
→ frontend
→ unit/integration tests
→ Playwright E2E
→ validation
```

Parallel work is acceptable only when contracts are stable.

Rules:

- keep ownership inside the feature
- reuse existing components
- preserve architecture
- add tests with the slice
- add Playwright when the user flow is completed
- do not start the next slice until current acceptance criteria and E2E pass
