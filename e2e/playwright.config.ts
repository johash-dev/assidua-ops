import { defineConfig } from '@playwright/test';

const baseURL = process.env.BASE_URL;
if (!baseURL)
  throw new Error('BASE_URL is required (run via scripts/e2e.sh <base-url>)');

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  outputDir: '../test-results',
  reporter: [['list']],
  failOnFlakyTests: true,
  use: { baseURL },
});
