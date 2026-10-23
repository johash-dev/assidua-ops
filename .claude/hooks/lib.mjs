// Shared helpers for harness hooks. Hooks must never crash open: on internal error they allow
// the call (exit 0) and print a warning, because settings.json permissions remain the backstop.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

export async function readStdinJson() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data ? JSON.parse(data) : {};
}

export function currentBranch(cwd = projectDir) {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

export function readConfig() {
  try {
    return JSON.parse(readFileSync(join(projectDir, "harness.config.json"), "utf8"));
  } catch {
    return null;
  }
}

const PREFLIGHT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

// A production release needs a fresh pre-flight marker written by scripts/harness/preflight.mjs.
export function hasFreshPreflight(version, now = Date.now(), dir = join(projectDir, ".claude", "state")) {
  if (!existsSync(dir)) return false;
  const files = readdirSync(dir).filter((f) => /^preflight-v\d+\.\d+\.\d+\.ok$/.test(f));
  const candidates = version ? files.filter((f) => f === `preflight-${version}.ok`) : files;
  return candidates.some((f) => {
    const p = join(dir, f);
    if (now - statSync(p).mtimeMs > PREFLIGHT_MAX_AGE_MS) return false;
    try {
      return JSON.parse(readFileSync(p, "utf8")).passed === true;
    } catch {
      return false;
    }
  });
}

export function block(reason) {
  process.stderr.write(`[harness guard] ${reason}\n`);
  process.exit(2);
}

export function ask(event, reason) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, permissionDecision: "ask", permissionDecisionReason: reason } }));
  process.exit(0);
}
