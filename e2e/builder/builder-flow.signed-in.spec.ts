import { expect, test } from "@playwright/test";
import { dismissPopups } from "../fixtures/api";

test.beforeEach(async ({ page }) => {
  await dismissPopups(page);
});

/** Signed in already: "Build my resume" goes straight to the new-resume flow, not onboarding. */
test("build my resume, signed in: the new-resume flow opens", async ({ page }) => {
  await page.goto("/dashboard/resumes");
  await page.evaluate(() =>
    localStorage.setItem("ix-resume-builder-flow", JSON.stringify({ until: Date.now() + 3_600_000, stage: "building" })),
  );
  await page.goto("/resume-builder/start");
  await expect(page).toHaveURL(/\/dashboard\/resumes\/new$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /start with a design you like/i })).toBeVisible({ timeout: 30_000 });
  await page.evaluate(() => localStorage.removeItem("ix-resume-builder-flow"));
});
