import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";

test("Admin can view seed tree, create a leaf, and deactivate it", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/taxonomy");
  await expect(page.getByRole("heading", { name: "Taxonomy" })).toBeVisible();
  await expect(page.locator('[data-testid="department"][data-name="Rivon"]')).toBeVisible();
  await expect(page.locator('[data-testid="category"][data-name="Car"]')).toBeVisible();
  await expect(page.locator('[data-testid="department"][data-name="Rover"]')).toBeVisible();
  await expect(page.locator('[data-testid="category"][data-name="Bike"]')).toBeVisible();
  await expect(page.locator('[data-testid="category"][data-name="Home Appliances"]')).toBeVisible();
  await expect(page.locator('[data-testid="category"][data-name="Tv"]')).toBeVisible();

  const leafName = `E2E-leaf-${Date.now()}`;
  await page
    .locator('[data-testid="department"][data-name="Rover"]')
    .getByRole("button", { name: "Add category" })
    .click();
  await page.getByTestId("taxonomy-name").fill(leafName);
  await page.getByRole("button", { name: "Save" }).click();
  const leaf = page.locator(`[data-testid="category"][data-name="${leafName}"]`);
  await expect(leaf).toBeVisible();
  await expect(leaf.getByText("Group", { exact: true })).toHaveCount(0);

  await leaf.getByRole("button", { name: "Deactivate" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Deactivate" }).click();
  await expect(leaf.getByText("Inactive", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/taxonomy$/);
});
