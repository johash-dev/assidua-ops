import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BLOCKING = ['serious', 'critical'];

/**
 * Run axe-core on the current page. Writes the full report when `captureDir` is set and
 * throws when any serious or critical violation is found (naming each rule).
 */
export async function expectNoSeriousA11yViolations(
  page: Page,
  captureDir?: string,
) {
  const results = await new AxeBuilder({ page }).analyze();
  if (captureDir) {
    await mkdir(captureDir, { recursive: true });
    await writeFile(
      join(captureDir, 'axe.json'),
      JSON.stringify(results.violations, null, 2),
    );
  }
  const blocking = results.violations.filter((v) =>
    BLOCKING.includes(v.impact ?? ''),
  );
  if (blocking.length > 0) {
    const lines = blocking.map(
      (v) => `${v.id} (${v.impact}): ${v.help} [${v.nodes.length} node(s)]`,
    );
    throw new Error(`axe-core found blocking violations:\n${lines.join('\n')}`);
  }
}

export const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 812 },
] as const;
