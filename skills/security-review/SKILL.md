---
name: security-review
description: Review software changes for authentication, authorization, input validation, secrets, data exposure, dependency, and destructive-operation risks.
---

# Security Review

Check:

- server-side authorization
- authentication boundaries
- role and department scoping
- input validation
- output/data exposure
- secret handling
- unsafe logging
- ORM/database misuse
- dependency risk
- command/file execution
- external integrations
- migrations
- destructive operations
- agent/tool prompt injection

For this project, preserve JWT authentication, server-side authorization, department scoping, append-only audit behavior, protected admin operations and secret management.

Never remove an authorization or validation check to make a test pass.
