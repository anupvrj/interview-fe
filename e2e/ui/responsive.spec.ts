import { expect, test } from "@playwright/test";

/** Key signed-out pages fit a phone: no sideways scrolling. */
for (const path of ["/resume-builder/start", "/ats-checker", "/ai-resume-builder"]) {
  test(`${path} has no horizontal scroll on a phone @mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(path);
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(sw).toBeLessThanOrEqual(cw + 1);
  });
}
