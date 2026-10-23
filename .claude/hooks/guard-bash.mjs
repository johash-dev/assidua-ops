// PreToolUse guard for Bash. Deterministic backstop behind the skills' approval gates.
import { pathToFileURL } from "node:url";
import { readStdinJson, currentBranch, hasFreshPreflight, block } from "./lib.mjs";

const PROD_VERSION = /\bv(\d+\.\d+\.\d+)(?![-\w.])/; // v1.2.3 but not v1.2.3-rc.1

// Pure decision function so scripts/harness/selfcheck.mjs can test it.
export function evaluate(command, { branch = null, preflight = () => false } = {}) {
  const cmd = command.replace(/\s+/g, " ").trim();
  const segments = cmd.split(/\s*(?:&&|\|\||;|\|)\s*/);

  for (const seg of segments) {
    if (/^git push\b/.test(seg)) {
      if (/\s(--force(-with-lease)?|-f)(\s|=|$)/.test(seg)) return "Force push is not allowed. Rebase onto a new branch instead.";
      if (/(\s|:)(main|master)(\s|$)/.test(seg)) return "Direct push to main is not allowed. Merge through a PR with /ship.";
      const refspecs = seg.split(" ").slice(2).filter((t) => !t.startsWith("-"));
      if (refspecs.length <= 1 && (branch === "main" || branch === "master")) return "You are on main; a bare push would push main. Use a story branch.";
      const v = seg.match(PROD_VERSION);
      if (v && !preflight(`v${v[1]}`)) return `Pushing production tag v${v[1]} needs a passing pre-flight. Run /release-prod.`;
    }
    if (/^git reset --hard\b/.test(seg) && (branch === "main" || branch === "master")) return "git reset --hard on main is not allowed.";
    if (/^git tag\b/.test(seg)) {
      const v = seg.match(PROD_VERSION);
      if (v && !preflight(`v${v[1]}`)) return `Creating production tag v${v[1]} needs a passing pre-flight. Run /release-prod.`;
    }
    if (/^gh release create\b/.test(seg)) {
      const v = seg.match(PROD_VERSION);
      if (v && !preflight(`v${v[1]}`)) return `Production release v${v[1]} needs a passing pre-flight. Run /release-prod.`;
    }
    if (/^gh workflow run\b.*deploy-prod/.test(seg)) {
      const v = seg.match(PROD_VERSION);
      if (!preflight(v ? `v${v[1]}` : null)) return "deploy-prod needs a passing pre-flight. Run /release-prod.";
    }
    if (/^gh api\b/.test(seg)) {
      if (/pending_deployments/.test(seg)) return "Approve deployments only through scripts/harness/approve-deployment.mjs (it enforces gates).";
      if (/(-X|--method)[ =]?DELETE\b/i.test(seg)) return "DELETE calls to the GitHub API are not allowed from the harness.";
    }
    if (/^gh (repo delete|secret (delete|set|remove))\b/.test(seg)) return "Repository deletion and secret changes are done by a human.";
    if (/^node scripts\/harness\/approve-deployment\.mjs\b.*\bproduction\b/.test(seg) && !preflight(null)) {
      return "Production approval needs a passing pre-flight. Run /release-prod.";
    }
  }

  if (/\b(drop\s+(database|schema|table)|truncate\s+table)\b/i.test(cmd) || /(^|\s)dropdb\b/.test(cmd)) {
    return "Destructive database commands are blocked. Use a reviewed migration.";
  }
  if (/preflight-v[\d.]+\.ok/.test(cmd) && !/^node scripts\/harness\/preflight\.mjs\b/.test(cmd)) {
    return "Pre-flight markers are written only by scripts/harness/preflight.mjs.";
  }
  return null;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const input = await readStdinJson();
    const reason = evaluate(input?.tool_input?.command ?? "", { branch: currentBranch(), preflight: (v) => hasFreshPreflight(v) });
    if (reason) block(reason);
  } catch (err) {
    process.stderr.write(`[harness guard] warning: guard-bash failed open: ${err.message}\n`);
  }
  process.exit(0);
}
