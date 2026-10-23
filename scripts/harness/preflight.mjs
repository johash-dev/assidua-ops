// Production release pre-flight. Writes .claude/state/preflight-<version>.ok only when every check passes;
// the guard hook refuses production tags/deploys/approvals without a fresh marker.
//   node scripts/harness/preflight.mjs v1.0.0 --jira-ready true --open-critical-high 0 --backup-id snap-123
// If JIRA_EMAIL/JIRA_API_TOKEN are set, the Jira facts are verified directly instead of trusting the flags.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { root, loadConfig, requireConfigured, gh, jira, parseArgs, fail } from "./common.mjs";

const { positional, flags } = parseArgs(process.argv.slice(2));
const version = positional[0];
if (!/^v\d+\.\d+\.\d+$/.test(version ?? "")) fail("usage: preflight.mjs vX.Y.Z --jira-ready true --open-critical-high 0 --backup-id <id>");

const cfg = loadConfig();
const repo = requireConfigured(cfg.github.repo, "github.repo");
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

// GitHub: main CI green
const ci = gh(["run", "list", "-R", repo, "--branch", "main", "--workflow", "ci.yml", "-L", "1", "--json", "conclusion,headSha,url"]);
check("main CI green", ci?.[0]?.conclusion === "success", ci?.[0] ? `${ci[0].conclusion} ${ci[0].url}` : "no CI runs on main");

// GitHub: an rc of this version deployed to staging
const staging = gh(["run", "list", "-R", repo, "--workflow", "deploy-staging.yml", "-L", "20", "--json", "headBranch,conclusion,url"]);
const rc = staging?.find((r) => r.headBranch?.startsWith(`${version}-rc.`) && r.conclusion === "success");
check("rc deployed to staging", rc, rc ? `${rc.headBranch} ${rc.url}` : `no successful staging deploy of ${version}-rc.*`);

// Jira: verified directly when credentials exist, otherwise from flags gathered by /release-prod via MCP
const fixVersion = version.slice(1);
if (process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN) {
  const key = cfg.jira.projectKey;
  const notReady = await jira("POST", "/rest/api/3/search/jql", {
    jql: `project = ${key} AND fixVersion = "${fixVersion}" AND status != "Ready for Prod" AND status != Done`,
    fields: ["key"], maxResults: 50,
  });
  check("all fixVersion issues Ready for Prod", notReady.issues.length === 0, notReady.issues.map((i) => i.key).join(", ") || "all ready");
  const bugs = await jira("POST", "/rest/api/3/search/jql", {
    jql: `project = ${key} AND issuetype = Bug AND priority in (Highest, High) AND statusCategory != Done`,
    fields: ["key"], maxResults: 50,
  });
  check("no open Critical/High bugs", bugs.issues.length === 0, bugs.issues.map((i) => i.key).join(", ") || "none");
} else {
  check("all fixVersion issues Ready for Prod (reported via MCP)", flags["jira-ready"] === "true", `flag=${flags["jira-ready"]}`);
  check("no open Critical/High bugs (reported via MCP)", flags["open-critical-high"] === "0", `flag=${flags["open-critical-high"]}`);
}

check("backup confirmed", typeof flags["backup-id"] === "string" && flags["backup-id"].length > 0, flags["backup-id"] ?? "missing --backup-id");

const passed = checks.every((c) => c.passed);
for (const c of checks) console.log(`${c.passed ? "✔" : "✖"} ${c.name} — ${c.detail}`);

if (!passed) fail(`pre-flight FAILED for ${version}; no marker written.`);
const dir = join(root, ".claude", "state");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, `preflight-${version}.ok`), JSON.stringify({ version, passed, checks, at: new Date().toISOString() }, null, 2));
console.log(`✔ pre-flight passed for ${version}; marker valid for 6 hours.`);
