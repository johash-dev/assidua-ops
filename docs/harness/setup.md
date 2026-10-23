# Harness Setup (one-time)

These are the steps that need Johash personally: sign-ins and admin rights. Everything after them runs from Claude Code.

## 1. GitHub CLI
```bash
gh auth login -h github.com
```
Use an account with admin rights on the Company-owned org/repo (proposal §10.5). Then create the repo and push. The harness can do this for you:
```bash
gh repo create <org>/assidua-ops --private --source . --push
```
Set `github.repo` in `harness.config.json`, and replace the owner in `.github/CODEOWNERS`.

## 2. Jira (Atlassian Remote MCP)
`.mcp.json` registers `https://mcp.atlassian.com/v1/mcp`. On first use, Claude Code opens the Atlassian OAuth consent in your browser; approve it for the Jira site. Then ask Claude for the `cloudId` (`getAccessibleAtlassianResources`), and set `jira.site`, `jira.cloudId` and `jira.boardId` in `harness.config.json`.

You create the Jira project (Scrum, key `KAN`, already exists as "Assidua Ops") once, or ask Claude to try it via MCP.

## 3. Jira REST token (only for bootstrap + pre-flight)
Create an API token at id.atlassian.com → Security. Keep it in your user environment, **never in the repo**:
```bash
setx JIRA_EMAIL "you@example.com"
```
```bash
setx JIRA_API_TOKEN "<token>"
```
Then:
```bash
node scripts/harness/jira-bootstrap.mjs
```
Review the dry run, then re-run it with `--apply`. If it reports missing workflow statuses, add them once in the Jira workflow editor. This is the only Jira admin UI step.

## 4. GitHub environments and protection
```bash
node scripts/harness/github-bootstrap.mjs
```
Review the dry run, then re-run it with `--apply`.

## 5. Check
```bash
node scripts/harness/selfcheck.mjs
```
Then start Claude Code in this folder and run `/today`.
