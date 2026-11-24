import { expect, test as setup } from "@playwright/test";
import path from "node:path";

/**
 * One-time sign-in for the signed-in suites (local app, QA database only). The session is
 * saved to e2e/.auth/user.json (git-ignored).
 *
 * With E2E_CLERK_USER_EMAIL / E2E_CLERK_USER_PASSWORD in the git-ignored .env.e2e (a dummy
 * user in Clerk's development instance), it signs in by itself. Without them, it waits for
 * a person to sign in in the visible browser.
 *
 *   npx playwright test --project=setup-auth
 */
export const AUTH_FILE = path.join(__dirname, ".auth", "user.json");

// Clerk's development instance accepts this fixed code for "+clerk_test" emails.
const CLERK_TEST_CODE = "424242";

setup("sign in once and save the session", async ({ page }) => {
  const email = process.env.E2E_CLERK_USER_EMAIL;
  const password = process.env.E2E_CLERK_USER_PASSWORD;
  setup.setTimeout(email ? 120_000 : 10 * 60 * 1000);
  await page.goto("/sign-in?redirect_url=%2Fdashboard%2Fresumes");

  if (email && password) {
    await page.getByLabel(/email/i).first().fill(email);
    await page.getByRole("button", { name: /^continue$/i }).click();
    // The page asks for either the password or an emailed code (sometimes both, e.g. a
    // new-device check). Test emails accept the fixed code, so no inbox is needed.
    const passwordField = page.getByLabel(/^password$/i);
    const rolePicker = page.getByRole("button", { name: /^Popular Candidate/i });
    for (let step = 0; step < 3; step++) {
      const next = await Promise.race([
        page.waitForURL(/\/dashboard(\/|$)/, { timeout: 30_000 }).then(() => "done" as const),
        rolePicker.waitFor({ timeout: 30_000 }).then(() => "done" as const),
        passwordField.waitFor({ timeout: 30_000 }).then(() => "password" as const),
        page.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"]').first().waitFor({ timeout: 30_000 }).then(() => "code" as const),
      ]);
      if (next === "done") break;
      if (next === "password") {
        await passwordField.fill(password);
        await page.getByRole("button", { name: /^continue$/i }).click();
      } else {
        await page.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"]').first().click();
        await page.keyboard.type(CLERK_TEST_CODE);
      }
      await page.waitForTimeout(1500);
    }
  }

  // A brand-new user is asked to pick a role once; the suites test the candidate side.
  const candidate = page.getByRole("button", { name: /^Popular Candidate/i });
  if (email && (await candidate.isVisible({ timeout: 5_000 }).catch(() => false))) {
    await candidate.click();
    await page.goto("/dashboard/resumes");
  }

  await expect(page).toHaveURL(/\/dashboard(\/|$)/, { timeout: email ? 60_000 : 10 * 60 * 1000 });
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  await page.context().storageState({ path: AUTH_FILE });
});
