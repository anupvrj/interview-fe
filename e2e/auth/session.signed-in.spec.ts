import { expect, test } from "@playwright/test";
import { dismissPopups } from "../fixtures/api";

// the trial offer and first-visit tour can pop up over the editor at any time
test.beforeEach(async ({ page }) => {
  await dismissPopups(page);
});

test.describe("signed-in session", () => {
  test("sign-up page sends a signed-in user to the dashboard", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page).toHaveURL(/\/dashboard(\/|$|\?)/, { timeout: 30_000 });
  });

  test("resumes dashboard loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/dashboard/resumes");
    await expect(page).toHaveURL(/\/dashboard\/resumes/);
    await expect(page.getByRole("main").first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("ATS checker (signed in) shows the upload step", async ({ page }) => {
    await page.goto("/dashboard/ats-checker");
    await expect(page.getByRole("button", { name: /upload your resume/i })).toBeVisible({ timeout: 30_000 });
  });
});
