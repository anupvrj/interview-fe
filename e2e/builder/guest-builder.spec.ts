import { expect, test } from "@playwright/test";

/** "Build my resume", signed out: the sign-up form (Google or email), then the new-resume flow. */
test.describe("resume builder start (signed out)", () => {
  test("opens the sign-up form, which comes back to the new-resume flow", async ({ page }) => {
    await page.goto("/resume-builder/start");
    await expect(page).toHaveURL(/\/sign-up\?redirect_url=%2Fdashboard%2Fresumes%2Fnew$/, { timeout: 30_000 });
    await expect(page.getByRole("button", { name: /google/i }).first()).toBeVisible({ timeout: 30_000 });
    // onboarding waits until the resume is built
    const flow = await page.evaluate(() => JSON.parse(localStorage.getItem("ix-resume-builder-flow") ?? "null"));
    expect(flow?.stage).toBe("building");
  });

  test("'Build my resume, free' on the builder page leads there", async ({ page }) => {
    await page.goto("/ai-resume-builder");
    await page.waitForFunction(() => Boolean((window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded), null, { timeout: 30_000 });
    const cta = page.getByRole("link", { name: /build my resume, free/i }).first();
    await expect(cta).toHaveAttribute("href", "/resume-builder/start");
  });
});
