// PostToolUse: format the edited file if the stack has provided scripts/format-file.sh (added after ADR-001).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { readStdinJson, projectDir } from "./lib.mjs";

try {
  const input = await readStdinJson();
  const file = input?.tool_input?.file_path;
  const formatter = join(projectDir, "scripts", "format-file.sh");
  if (file && existsSync(formatter)) {
    execFileSync("bash", [formatter, file], { cwd: projectDir, stdio: "ignore", timeout: 30000 });
  }
} catch {
  // Formatting is best-effort; verify.sh is the real format gate.
}
process.exit(0);
