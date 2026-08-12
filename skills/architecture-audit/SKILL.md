---
name: architecture-audit
description: Audit an existing codebase or feature against the project's architecture rules and identify concrete violations, risks, and simplification opportunities.
---

# Architecture Audit

Check:

- feature ownership
- dependency direction
- business logic placement
- controller thinness
- repository boundaries
- cross-feature communication
- shared-code discipline
- file/function size
- naming
- validation
- authorization
- testing
- external-provider isolation
- configuration
- architectural drift

Expected dependency direction:

```text
Controller → Service → Repository → Prisma → PostgreSQL
```

Do not perform fixes unless explicitly requested.

Output:

```text
Finding:
Location:
Rule:
Evidence:
Severity:
Minimal correction:
Do now / defer:
```
