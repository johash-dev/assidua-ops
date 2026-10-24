import { expect, test } from '@playwright/test';
import { join } from 'node:path';
import { VIEWPORTS, expectNoSeriousA11yViolations } from './axe';

const captureKey = process.env.UI_CAPTURE_KEY;
const captureDir = captureKey
  ? join(process.cwd(), '.artifacts', captureKey)
  : undefined;
const path = process.env.SMOKE_PATH ?? '/health';

test.describe('@smoke', () => {
  for (const viewport of VIEWPORTS) {
    test(`${path} loads and is accessible (${viewport.name})`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      const response = await page.goto(path);
      expect(response?.ok()).toBe(true);
      await expect(page.locator('main')).toBeVisible();
      if (captureDir) {
        await page.screenshot({
          path: join(captureDir, `${viewport.name}-${viewport.width}.png`),
          fullPage: true,
        });
      }
      await expectNoSeriousA11yViolations(
        page,
        captureDir && join(captureDir, viewport.name),
      );
    });
  }
});
