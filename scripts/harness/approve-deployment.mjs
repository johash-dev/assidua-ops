// Approve a GitHub Actions run waiting on an environment's required-reviewer gate.
// Called by /release-uat (staging) and /release-prod (production) only after the ⛔ gate in chat.
//   node scripts/harness/approve-deployment.mjs <run-id> <staging|production>
import { hasFreshPreflight } from "../../.claude/hooks/lib.mjs";
import { loadConfig, requireConfigured, gh, parseArgs, fail } from "./common.mjs";

const { positional, flags } = parseArgs(process.argv.slice(2));
const [runId, envName] = positional;
if (!/^\d+$/.test(runId ?? "") || !["staging", "production"].includes(envName)) {
  fail("usage: approve-deployment.mjs <run-id> <staging|production> [--comment text]");
}
if (envName === "production" && !hasFreshPreflight(null)) {
  fail("production approval requires a fresh pre-flight marker (run /release-prod).");
}

const repo = requireConfigured(loadConfig().github.repo, "github.repo");
const pending = gh(["api", `repos/${repo}/actions/runs/${runId}/pending_deployments`]);
const target = pending.find((p) => p.environment?.name === envName);
if (!target) fail(`run ${runId} is not waiting on environment "${envName}" (pending: ${pending.map((p) => p.environment?.name).join(", ") || "none"}).`);
if (!target.current_user_can_approve) fail(`your GitHub user is not an allowed reviewer for "${envName}" (or self-review is prevented).`);

gh([
  "api", "-X", "POST", `repos/${repo}/actions/runs/${runId}/pending_deployments`,
  "-F", `environment_ids[]=${target.environment.id}`,
  "-f", "state=approved",
  "-f", `comment=${flags.comment ?? `Approved via Assidua Ops harness after in-chat gate`}`,
]);
console.log(`✔ approved run ${runId} for ${envName}`);
