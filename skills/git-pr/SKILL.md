---
name: git-pr
description: Prepare small, reviewable Git changes and pull requests using the project's branching, commit, validation, and release conventions.
---

# Git & Pull Request

Project defaults:

- GitHub Flow
- branch from `main`
- no direct commits to `main`
- short-lived branches
- Conventional Commits
- squash merge by default
- SemVer releases
- production from tags/manual approval

Before commit, inspect working tree, diff, tests, unintended files, secrets and migrations.

Commit format:

```text
type(scope): imperative description
```

PRs should include summary, related work, change type, tests, manual verification and migration notes where applicable.

Never commit secrets or environment credentials.
