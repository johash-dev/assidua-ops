// PreToolUse guard for Edit/Write: protect secrets, gate scope changes, and protect pre-flight markers.
import { pathToFileURL } from "node:url";
import { readStdinJson, block, ask } from "./lib.mjs";

export function evaluate(filePath) {
  const p = filePath.replace(/\\/g, "/");
  if (/(^|\/)\.env(\.|$)/.test(p) && !/\.env\.example$/.test(p)) return { decision: "block", reason: "Secrets files are edited by a human, not the harness." };
  if (/\.claude\/state\/preflight-/.test(p)) return { decision: "block", reason: "Pre-flight markers are written only by scripts/harness/preflight.mjs." };
  if (/docs\/scope\/approved-scope\.md$/.test(p)) {
    return { decision: "ask", reason: "Approved Scope changes only via a client-approved Change Request (§13). Confirm a CR-### with written approval exists." };
  }
  return null;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const input = await readStdinJson();
    const result = evaluate(input?.tool_input?.file_path ?? "");
    if (result?.decision === "block") block(result.reason);
    if (result?.decision === "ask") ask("PreToolUse", result.reason);
  } catch (err) {
    process.stderr.write(`[harness guard] warning: guard-edit failed open: ${err.message}\n`);
  }
  process.exit(0);
}
