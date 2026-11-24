import { expect, test } from "@playwright/test";

/** Signed-out visitors: protected pages send them to sign in and back; sign-up is email-first. */

test.describe("authentication, signed out", () => {
  for (const path of ["/dashboard/resumes", "/dashboard/resumes/new", "/dashboard/ats-checker"]) {
    test(`${path} asks to sign in, then returns there`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/sign-in\?redirect_url=/);
      expect(decodeURIComponent(new URL(page.url()).searchParams.get("redirect_url") ?? "")).toContain(path);
    });
  }

  test("sign-up starts with the email (existing accounts sign in from the same form)", async ({ page }) => {
    await page.goto("/sign-up?redirect_url=%2Fdashboard%2Fats-checker");
    await expect(page.getByRole("heading", { name: /continue with your email/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
  });
});
