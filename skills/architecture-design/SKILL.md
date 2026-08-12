---
name: architecture-design
description: Design a minimal, project-consistent technical solution for a feature or change after understanding the existing architecture.
---

# Architecture Design

## Principle

Change the smallest architectural surface that safely solves the problem.

## Procedure

1. Read authoritative architecture.
2. Inspect affected implementation.
3. Identify existing boundaries.
4. Identify reusable patterns.
5. Determine API/data/UI/security impact.
6. Compare reasonable alternatives.
7. Select the simplest compatible design.
8. Record material decisions.

## Assidua rules

Respect the modular monolith, feature-first organization, service-owned business rules, repository-only DB access, thin controllers, server-side authorization, feature-owned tests, and evolutionary architecture.

## Never

- introduce microservices for convenience
- introduce broad clean architecture prematurely
- add speculative abstractions
- redesign unrelated features

## Output

Current architecture, affected boundaries, proposed design, files/components, contracts, data changes, security, testing, risks, alternatives and decision.
