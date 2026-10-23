---
name: ship
description: Push the story branch, open a PR with acceptance-criteria checklist and verification evidence, wait for CI, and — after approval — squash-merge, which triggers the QA deployment; keeps Jira status in sync. Use after /review passes.
argument-hint: [KAN-key]
---

Follow `docs/harness/skill-conventions.md`.

1. **Preconditions:** `.claude/state/review-KAN-<n>.md` says PASS and is newer than the last commit. Otherwise: **Next →** `/review KAN-<n>`.
2. `git push -u origin KAN-<n>-<slug>`.
3. `gh pr create -R <repo> --base main --title "KAN-<n>: <summary>"`, with a body following `.github/pull_request_template.md`:
   - a Jira link
   - the AC checklist, with the test that proves each AC
   - the verify.sh evidence
   - the review verdict
   - migrations + rollback
   - screenshots (for ui stories)
   - risks
4. Transition Jira to `In Review`, and comment with the PR link.
5. Watch CI: `gh pr checks <pr> --watch`. If it goes red: summarise the failing job (`gh run view <id> --log-failed`), stop, and **Next →** `/build KAN-<n>`.
6. ⛔ **Merge gate**. Show:
   - the diff stat
   - the CI result
   - the review verdict and advisory items
   - the "needs human eye" items
   - the AC → evidence map
7. On approval:
   - `gh pr merge <pr> --squash --delete-branch`
   - `git switch main && git pull`
   - transition Jira to `Ready for QA`, and comment with the merge SHA
8. Note that `deploy-qa` starts automatically. Show its run id: `gh run list -R <repo> --workflow deploy-qa.yml -L 1`.

End with the evidence report and **Next →** (`/qa KAN-<n>` once deploy-qa succeeds).
