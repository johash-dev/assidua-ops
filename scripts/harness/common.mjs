// Shared helpers for harness scripts (Node ≥ 20, no dependencies).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function loadConfig() {
  return JSON.parse(readFileSync(join(root, "harness.config.json"), "utf8"));
}

export function requireConfigured(value, name) {
  if (value == null || String(value).includes("TODO")) {
    fail(`${name} is not configured in harness.config.json (see docs/harness/setup.md)`);
  }
  return value;
}

export function gh(args, { json = true } = {}) {
  const out = execFileSync("gh", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return json ? JSON.parse(out || "null") : out;
}

export function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) flags[a.slice(2)] = true;
      else flags[a.slice(2)] = argv[++i];
    } else positional.push(a);
  }
  return { positional, flags };
}

export async function jira(method, path, body) {
  const cfg = loadConfig();
  const site = requireConfigured(cfg.jira.site, "jira.site");
  const { JIRA_EMAIL, JIRA_API_TOKEN } = process.env;
  if (!JIRA_EMAIL || !JIRA_API_TOKEN) fail("Set JIRA_EMAIL and JIRA_API_TOKEN in your environment (never in the repo).");
  const res = await fetch(`https://${site}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Jira ${method} ${path} → ${res.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

export function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}
