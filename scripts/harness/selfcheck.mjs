// Harness self-check: config validity, skill/agent structure, Next → handoff, doc links, and guard-hook
// behaviour. Runs first in scripts/verify.sh and therefore in CI.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { root } from "./common.mjs";
import { evaluate as guardBash } from "../../.claude/hooks/guard-bash.mjs";
import { evaluate as guardEdit } from "../../.claude/hooks/guard-edit.mjs";

const errors = [];
const ok = [];
const expect = (cond, msg) => (cond ? ok.push(msg) : errors.push(msg));

// Config
let cfg;
try {
  cfg = JSON.parse(readFileSync(join(root, "harness.config.json"), "utf8"));
  expect(cfg.jira?.projectKey && cfg.github?.repo && cfg.project?.timezone === "Asia/Colombo", "harness.config.json has jira, github, project.timezone=Asia/Colombo");
} catch (e) {
  errors.push(`harness.config.json invalid: ${e.message}`);
}
for (const f of [".claude/settings.json", ".mcp.json"]) {
  try {
    JSON.parse(readFileSync(join(root, f), "utf8"));
    ok.push(`${f} is valid JSON`);
  } catch (e) {
    errors.push(`${f} invalid: ${e.message}`);
  }
}

// Skills: frontmatter + Next → handoff + conventions reference
const EXPECTED_SKILLS = ["today", "scope-check", "adr", "breakdown", "refine", "start", "build", "review", "ship", "qa", "release-uat", "uat-intake", "release-prod", "hotfix", "learn"];
const skillsDir = join(root, ".claude", "skills");
for (const name of EXPECTED_SKILLS) {
  const p = join(skillsDir, name, "SKILL.md");
  if (!existsSync(p)) { errors.push(`skill missing: ${name}`); continue; }
  const text = readFileSync(p, "utf8");
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  expect(fm && new RegExp(`^name: ${name}$`, "m").test(fm[1]) && /^description: .{40,}/m.test(fm[1]), `skill ${name}: frontmatter name/description`);
  expect(text.includes("Next →"), `skill ${name}: ends with a Next → handoff`);
  expect(text.includes("skill-conventions.md"), `skill ${name}: follows skill-conventions.md`);
}

// Next-step routing covers every skill
const routing = readFileSync(join(root, "docs", "harness", "next-step.md"), "utf8");
for (const name of EXPECTED_SKILLS) expect(routing.includes(`/${name}`), `next-step.md routes /${name}`);

// Agents
for (const name of ["explorer", "reviewer", "ui-reviewer", "qa-tester"]) {
  const p = join(root, ".claude", "agents", `${name}.md`);
  expect(existsSync(p) && new RegExp(`^name: ${name}$`, "m").test(readFileSync(p, "utf8")), `agent ${name} defined`);
}

// Relative markdown links in docs/ and CLAUDE.md resolve
const mdFiles = [join(root, "CLAUDE.md")];
const walk = (d) => readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".md") && mdFiles.push(join(d, e.name))));
walk(join(root, "docs"));
for (const f of mdFiles) {
  for (const [, target] of readFileSync(f, "utf8").matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
    if (/^[a-z]+:/i.test(target)) continue;
    expect(existsSync(resolve(dirname(f), target)), `link ${f.slice(root.length + 1)} → ${target}`);
  }
}

// Guard hook behaviour (deterministic safety cases)
const noPreflight = { branch: "KAN-1-x", preflight: () => false };
const withPreflight = { branch: "KAN-1-x", preflight: () => true };
const cases = [
  ["git push origin main", noPreflight, true],
  ["git push --force origin KAN-1-x", noPreflight, true],
  ["git push -u origin KAN-1-x", noPreflight, false],
  ["git push", { branch: "main", preflight: () => false }, true],
  ["git tag v1.0.0", noPreflight, true],
  ["git tag v1.0.0", withPreflight, false],
  ["git tag v1.0.0-rc.1 && git push origin v1.0.0-rc.1", noPreflight, false],
  ["gh release create v1.0.0 --target main", noPreflight, true],
  ["gh workflow run deploy-prod.yml", noPreflight, true],
  ["gh api repos/x/y/actions/runs/1/pending_deployments", noPreflight, true],
  ["gh api -X DELETE repos/x/y", noPreflight, true],
  ["gh repo delete x/y --yes", noPreflight, true],
  ["psql -c 'DROP TABLE jobs'", noPreflight, true],
  ["echo '{}' > .claude/state/preflight-v1.0.0.ok", noPreflight, true],
  ["node scripts/harness/approve-deployment.mjs 123 production", noPreflight, true],
  ["node scripts/harness/approve-deployment.mjs 123 staging", noPreflight, false],
  ["git reset --hard origin/main", { branch: "main", preflight: () => false }, true],
  ["bash scripts/verify.sh", noPreflight, false],
];
for (const [cmd, ctx, shouldBlock] of cases) {
  const blocked = Boolean(guardBash(cmd, ctx));
  expect(blocked === shouldBlock, `guard-bash ${shouldBlock ? "blocks" : "allows"}: ${cmd}`);
}
const editCases = [
  [".env", "block"], [".env.production", "block"], [".env.example", null],
  [".claude/state/preflight-v1.0.0.ok", "block"], ["docs/scope/approved-scope.md", "ask"], ["src/app.ts", null],
];
for (const [p, want] of editCases) {
  expect((guardEdit(p)?.decision ?? null) === want, `guard-edit ${want ?? "allows"}: ${p}`);
}

console.log(`harness selfcheck: ${ok.length} passed, ${errors.length} failed`);
for (const e of errors) console.error(`  ✖ ${e}`);
process.exit(errors.length ? 1 : 0);
