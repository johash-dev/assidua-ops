import { expect, test } from "@playwright/test";

test("smoke page shows heading and healthy API", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Assidua Ops" })).toBeVisible();
  await expect(page.getByTestId("health")).toHaveText(/health: ok db: up/, {
    timeout: 15_000,
  });
});
