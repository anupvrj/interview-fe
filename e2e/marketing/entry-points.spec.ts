import { expect, test } from "@playwright/test";

/** Where the resume builder and ATS checker are entered from, and that those pages load cleanly. */

test.describe("entry points", () => {
  test("home links to the builder and the checker", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/ai-resume-builder"]').first()).toBeAttached();
    await expect(page.locator('a[href="/ats-checker"]').first()).toBeAttached();
  });

  test("on the resume builder page, Start free opens the public builder (no sign-up first)", async ({ page }) => {
    await page.goto("/ai-resume-builder");
    // wait for Clerk, so this is the signed-out link and not a pre-load placeholder
    await page.waitForFunction(() => Boolean((window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded), null, { timeout: 30_000 });
    const start = page.getByRole("link", { name: /^start free$/i }).first();
    await expect(start).toHaveAttribute("href", "/resume-builder/start");
    await start.click();
    await expect(page).toHaveURL(/\/resume-builder\/start$/);
    await expect(page.getByRole("button", { name: /start from scratch/i })).toBeVisible();
  });

  for (const path of ["/ai-resume-builder", "/ats-checker"]) {
    test(`${path} loads without errors or failed requests @mobile`, async ({ page }) => {
      const problems: string[] = [];
      page.on("pageerror", (err) => problems.push(`page error: ${err.message}`));
      page.on("console", (msg) => {
        if (msg.type() === "error" && !/Failed to load resource|favicon|third-party|gtag|fbq/i.test(msg.text())) {
          problems.push(`console: ${msg.text().slice(0, 200)}`);
        }
      });
      page.on("response", (res) => {
        const url = res.url();
        if (res.status() >= 500 && url.includes("localhost")) problems.push(`${res.status()} ${url}`);
      });
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      await page.waitForLoadState("networkidle").catch(() => {});
      expect(problems).toEqual([]);
      // no sideways scrolling on phones
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
