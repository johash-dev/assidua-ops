---
name: testing-validation
description: Design and execute meaningful deterministic validation for a software change, including unit, integration, and Playwright E2E tests where applicable.
---

# Testing & Validation

Tests are evidence of behavior.

Use the project's test stack:

- backend unit: Jest
- backend integration: Jest + Supertest
- frontend unit: Vitest or Jest as appropriate
- E2E: Playwright

Procedure:

1. Map acceptance criteria to tests.
2. Identify business-rule tests.
3. Identify authorization boundaries.
4. Identify data/transaction behavior.
5. Identify critical user flows.
6. Add tests with implementation.
7. Run deterministic checks.
8. Investigate failures.
9. Record evidence.

Never delete or weaken tests just to make CI green. Never claim a test passed without running it.
