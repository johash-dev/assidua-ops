// One-time GitHub repo setup: environments (qa, staging, production) with reviewers, branch protection
// on main, and security features. Dry-run by default; pass --apply to make changes.
//   node scripts/harness/github-bootstrap.mjs [--apply]
import { writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadConfig, requireConfigured, gh, parseArgs } from "./common.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const apply = flags.apply === true;
const cfg = loadConfig();
const repo = requireConfigured(cfg.github.repo, "github.repo");
const me = gh(["api", "user"]);

function put(path, body, desc) {
  console.log(`  • ${desc}`);
  if (!apply) return;
  const file = join(tmpdir(), `gh-body-${Date.now()}.json`);
  writeFileSync(file, JSON.stringify(body));
  try {
    gh(["api", "-X", "PUT", path, "--input", file]);
  } finally {
    rmSync(file, { force: true });
  }
}

console.log(`${apply ? "Applying" : "Dry run — would apply"} to ${repo} as ${me.login}:`);

for (const [name, env] of Object.entries(cfg.github.environments)) {
  const body = env.approval
    ? { reviewers: [{ type: "User", id: me.id }], prevent_self_review: false, deployment_branch_policy: null }
    : { deployment_branch_policy: { protected_branches: true, custom_branch_policies: false } };
  put(`repos/${repo}/environments/${name}`, body, `environment ${name}${env.approval ? ` (required reviewer: ${me.login})` : " (protected branches only)"}`);
}

put(
  `repos/${repo}/branches/${cfg.github.defaultBranch}/protection`,
  {
    required_status_checks: { strict: true, contexts: ["verify"] },
    enforce_admins: false,
    required_pull_request_reviews: { required_approving_review_count: 0 },
    restrictions: null,
    required_linear_history: true,
    allow_force_pushes: false,
    allow_deletions: false,
  },
  `branch protection on ${cfg.github.defaultBranch} (PR required, required check: verify, linear history, no force push)`
);

console.log("  • enable vulnerability alerts + automated security fixes");
if (apply) {
  gh(["api", "-X", "PUT", `repos/${repo}/vulnerability-alerts`], { json: false });
  gh(["api", "-X", "PUT", `repos/${repo}/automated-security-fixes`], { json: false });
}
if (!apply) console.log("\nRe-run with --apply to make these changes.");
