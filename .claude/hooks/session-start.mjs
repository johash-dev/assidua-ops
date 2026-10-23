// SessionStart: stdout becomes session context. Keep it short.
import { currentBranch, readConfig } from "./lib.mjs";

const lines = [];
const branch = currentBranch();
const key = branch?.match(/^(?:hotfix\/)?(AO-\d+)/)?.[1];
lines.push(`Harness: branch=${branch ?? "none"}${key ? ` story=${key}` : ""}`);

const cfg = readConfig();
if (!cfg) {
  lines.push("harness.config.json missing or invalid — run node scripts/harness/selfcheck.mjs");
} else {
  const todos = JSON.stringify(cfg).match(/"TODO/g)?.length ?? 0;
  if (todos) lines.push(`Setup incomplete: ${todos} TODO value(s) in harness.config.json (see docs/harness/setup.md).`);
  if (!cfg.stack?.decided) lines.push("Stack not decided: next is /adr stack (ADR-001).");
  else if (!cfg.hosting?.decided) lines.push("Hosting not decided: /adr hosting (ADR-002) before any deploy.");
}
lines.push("Start of day: /today. Every skill ends with a Next → block (docs/harness/next-step.md).");
process.stdout.write(lines.join("\n") + "\n");
