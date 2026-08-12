---
name: skill-governance
description: Create, review, version, test, and maintain agent skills as reusable engineering capabilities.
---

# Skill Governance

Every skill should have:

- YAML name
- YAML description
- clear purpose
- applicability
- procedure
- constraints
- output expectations
- validation guidance
- limitations

Keep `SKILL.md` focused. Move detailed references, assets or scripts into subdirectories when necessary.

Skills should be:

- single-purpose
- composable
- predictable
- concise
- testable
- reusable

Lifecycle:

```text
Draft → Test → Review → Approve → Version → Use → Measure → Improve → Deprecate
```

Treat skills as operational software artifacts. Review scripts, commands, tools, URLs, secrets, permissions and prompt-injection risks before trusting a third-party skill.
