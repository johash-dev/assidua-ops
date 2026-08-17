import { expect, test } from "@playwright/test";
import { login, loginAsAdmin } from "./helpers/login";

test("Admin creates FD user, that user signs in, non-Admin is denied Users", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/staff-users");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

  const email = `e2e-fd-${Date.now()}@local.test`;
  await page.getByRole("button", { name: "Add user" }).click();
  await page.getByTestId("user-name").fill("E2E Front Desk");
  await page.getByTestId("user-email").fill(email);
  await page.getByTestId("user-password").fill("password1");
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await expect(page.locator(`[data-testid="staff-user"][data-email="${email}"]`)).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await login(page, email, "password1");
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();

  await page.goto("/staff-users");
  await expect(page.getByRole("heading", { name: "You do not have access to this page." })).toBeVisible();
});

test("sole-DH vacate is rejected and one-step replacement succeeds", async ({ page }) => {
  await loginAsAdmin(page);
  const stamp = Date.now();
  const deptName = `E2E-DH-${stamp}`;
  const outEmail = `e2e-out-${stamp}@local.test`;
  const inEmail = `e2e-in-${stamp}@local.test`;
  const dept = await page.request.post("/api/departments", {
    data: { name: deptName, defaultSlaDays: 10 },
  });
  expect(dept.ok()).toBeTruthy();
  const deptJson = (await dept.json()) as { id: string };
  const outgoing = await page.request.post("/api/staff-users", {
    data: {
      name: "E2E Outgoing DH",
      email: outEmail,
      password: "password1",
      role: "DEPARTMENT_HEAD",
      departmentId: deptJson.id,
    },
  });
  expect(outgoing.ok()).toBeTruthy();

  await page.goto("/staff-users");
  await page.getByRole("button", { name: "Add user" }).click();
  await page.getByTestId("user-name").fill("E2E Incoming");
  await page.getByTestId("user-email").fill(inEmail);
  await page.getByTestId("user-password").fill("password1");
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await expect(page.locator(`[data-testid="staff-user"][data-email="${inEmail}"]`)).toBeVisible();

  const outRow = page.locator(`[data-testid="staff-user"][data-email="${outEmail}"]`);
  await outRow.getByRole("button", { name: "Deactivate" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Deactivate" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Replace the department head");
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
  await expect(outRow.getByText("Active")).toBeVisible();

  await page.getByRole("button", { name: "Replace DH" }).click();
  await page.getByTestId("replace-department").selectOption({ label: deptName });
  await page.getByTestId("replace-incoming").selectOption({ label: `E2E Incoming (${inEmail})` });
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await expect(page.locator(`[data-testid="staff-user"][data-email="${inEmail}"]`)).toContainText(
    "Department head",
  );
  await expect(outRow).toContainText("Front desk");
});
