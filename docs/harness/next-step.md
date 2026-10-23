# Next-Step Routing

Every harness skill ends its final response with a **Next →** block, routed by this table. This table is the single source of truth. When a routing proves wrong, `/learn` fixes it here.

## Block format (exact)
```
**Next →** `/<skill> <args>` — <one line: why this is the next task>
<optional> Blocked by: <what> · Unblocks when: <condition>
<optional> Then: `/<skill> <args>` (the step after)
```
If nothing is actionable:
```
**Next →** waiting — <on what> · Unblocks when: <condition> · Meanwhile: `/<skill> <args>` (best parallel task, if any)
```

## How to decide (in order)
1. **Live state, not memory.** Query Jira (my issues, ranked Ready stories, versions) and GitHub (`gh pr list`, `gh run list`) before choosing.
2. **Fire first:**
   - an open warranty **Critical/High** Bug → `/hotfix`
   - a red CI on my open PR → `/build <key>` to fix it
3. **Finish before starting:** an in-flight story (In Progress / In Review) beats picking a new one.
4. Otherwise, follow the lifecycle table below.

## Lifecycle routing
| Just finished | Condition | Next |
|---|---|---|
| `/today` | Any of the "fire" items | that item |
| `/today` | Story In Progress assigned to me | `/build <key>` (or `/review <key>` if the build is green and unreviewed) |
| `/today` | No in-flight work, Ready stories exist | `/start <top Ready key>` |
| `/today` | Top-ranked To Do stories not Ready | `/refine <key>` |
| `/today` | No stories for the next build phase | `/breakdown <epic/§>` |
| `/adr` | Stack ADR accepted | wire `verify.sh`/CI via `/build <ADR task key>`, then `/breakdown Foundation` |
| `/breakdown` | Stories created | `/refine <first story lacking DoR>`, else `/start <top Ready>` |
| `/refine` | Story now Ready | `/start <key>` |
| `/start` | Plan approved | `/build <key>` |
| `/build` | verify.sh green | `/review <key>` |
| `/build` | verify.sh red after 3 attempts | waiting — needs your decision. Then: `/learn` |
| `/review` | No blocking findings | `/ship <key>` |
| `/review` | Blocking findings | `/build <key>` (fix findings) |
| `/ship` | Merged, deploy-qa running | `/qa <key>` (once deploy-qa succeeds) |
| `/ship` | CI red | `/build <key>` |
| `/qa` | Passed, more Ready stories | `/start <next Ready>` |
| `/qa` | Passed, all fixVersion stories Ready for UAT | `/release-uat <version>-rc.<n>` |
| `/qa` | Failed | `/build <key>` (story bounced, Bug linked) |
| `/release-uat` | Deployed | waiting — client UAT feedback (business days left). Meanwhile: `/start` the next story or the open Bug |
| `/uat-intake` | Critical/High defects | `/start <top bug>` |
| `/uat-intake` | Accepted, or deemed accepted | `/release-prod <version>` |
| `/uat-intake` | CRs identified | `/scope-check` on each (draft CR) |
| `/release-prod` | Live | `/today` tomorrow. Warranty clock started. Also run `/learn` for a release retro |
| `/hotfix` | Released | `/learn <bug key>` (regression test + root-cause layer) |
| `/scope-check` | In scope | `/breakdown` or `/refine` the resulting story |
| `/scope-check` | CR drafted | waiting — client written approval of CR-### |
| `/learn` | Done | whatever `/today` would pick |
