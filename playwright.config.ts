import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:4001";
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:4000";
const root = __dirname;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: webOrigin,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node dist/main.js",
      cwd: path.join(root, "apps/api"),
      url: `${apiOrigin}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npx next start --port 4000",
      cwd: path.join(root, "apps/web"),
      url: webOrigin,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
