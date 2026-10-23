// One-time Jira project setup through the REST API (versions, status check). The harness uses no
// sprints, and areas are `area:` labels (no setup needed). Dry-run by default; pass --apply to make changes.
//   JIRA_EMAIL=… JIRA_API_TOKEN=… node scripts/harness/jira-bootstrap.mjs [--apply]
// Workflow transitions between statuses are reported, not edited: if statuses are missing from the
// project's workflow, the script prints exactly what to add (one admin step).
import { loadConfig, requireConfigured, jira, parseArgs } from "./common.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const apply = flags.apply === true;
const cfg = loadConfig();
const key = requireConfigured(cfg.jira.projectKey, "jira.projectKey");
requireConfigured(cfg.jira.site, "jira.site");

const VERSIONS = [cfg.jira.fixVersions.mvp];
const plan = [];
const act = async (desc, fn) => {
  plan.push(desc);
  if (apply) await fn();
};

const project = await jira("GET", `/rest/api/3/project/${key}`);
console.log(`Project ${project.key} — ${project.name} (${project.style ?? "classic"})`);

const existingVersions = new Set((await jira("GET", `/rest/api/3/project/${key}/versions`)).map((v) => v.name));
for (const name of VERSIONS.filter((v) => !existingVersions.has(v))) {
  await act(`create version ${name}`, () => jira("POST", "/rest/api/3/version", { projectId: project.id, name }));
}

const statusesByType = await jira("GET", `/rest/api/3/project/${key}/statuses`);
const storyStatuses = new Set((statusesByType.find((t) => t.name === "Story")?.statuses ?? []).map((s) => s.name));
const missingStatuses = cfg.jira.statuses.filter((s) => !storyStatuses.has(s));

console.log(`\n${apply ? "Applied" : "Dry run — would apply"}:`);
for (const p of plan) console.log(`  • ${p}`);
if (!plan.length) console.log("  • nothing; project already matches");
if (missingStatuses.length) {
  console.log(`\n⚠ Story workflow is missing statuses: ${missingStatuses.join(", ")}`);
  console.log("  Add them to the project workflow in order (docs/harness/jira-model.md → Workflow). This is the one Jira admin step the harness cannot do safely.");
} else {
  console.log("\n✔ Story workflow has all harness statuses.");
}
