import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const rootEnv = resolve(__dirname, "../../.env");
if (existsSync(rootEnv)) {
  config({ path: rootEnv });
}

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["test/setup.ts"],
    include: ["src/**/*.spec.ts", "test/**/*.spec.ts"],
  },
});
