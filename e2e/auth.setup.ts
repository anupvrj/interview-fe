import { expect, test as setup } from "@playwright/test";
import path from "node:path";

/**
 * One-time sign-in for the signed-in suites. Opens the local sign-in page in a visible
 * browser; the owner signs in with their own account (local app, QA database only) and the
 * session is saved to e2e/.auth/user.json (git-ignored). Nothing is typed by the test.
 *
 *   npx playwright test --project=setup-auth --headed
 */
export const AUTH_FILE = path.join(__dirname, ".auth", "user.json");

setup("sign in once and save the session", async ({ page }) => {
  setup.setTimeout(10 * 60 * 1000);
  await page.goto("/sign-in?redirect_url=%2Fdashboard%2Fresumes");
  // Wait for the person to finish signing in (any dashboard page).
  await expect(page).toHaveURL(/\/dashboard(\/|$)/, { timeout: 10 * 60 * 1000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.context().storageState({ path: AUTH_FILE });
});
