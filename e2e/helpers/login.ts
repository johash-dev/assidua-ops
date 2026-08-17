import { expect, type Page, test } from "@playwright/test";

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@local.test";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "dev-admin-password";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function loginAsAdmin(page: Page) {
  await login(page, adminEmail, adminPassword);
  await expect(page).toHaveURL(/\/taxonomy$/);
}
