import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envFiles = [
  resolve(__dirname, "../.env"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../.env"),
];
for (const rootEnv of envFiles) {
  if (existsSync(rootEnv)) {
    config({ path: rootEnv });
    break;
  }
}

export default defineConfig({
  test: {
    fileParallelism: false,
    environment: "node",
    setupFiles: ["test/setup.ts"],
    include: ["src/**/*.spec.ts", "test/**/*.spec.ts"],
  },
});
