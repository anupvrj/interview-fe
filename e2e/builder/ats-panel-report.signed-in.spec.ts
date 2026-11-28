import { expect, test } from "@playwright/test";
import path from "node:path";
import { dismissPopups, fictionalContent, resumes, session, type TestResume } from "../fixtures/api";

/**
 * The editor's ATS panel is the one report: one score, every check listed once (passed ones too),
 * no second "detailed report" with its own score — on a wide screen too. @real-ai (ATS check).
 */
test.describe("ATS panel report", () => {
  let created: TestResume | undefined;
  test.beforeEach(async ({ page }) => {
    const api = resumes(page.request, await session(page));
    created = await api.create(`E2E ats panel ${Date.now()}`, fictionalContent());
    await api.rescore(created.resumeId);
  });
  test.afterEach(async ({ page }) => {
    if (created) await resumes(page.request, await session(page)).remove(created.resumeId);
  });

  test("one score, one list of checks, no squeezed second report", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1800, height: 1000 });
    await page.goto(`/dashboard/resumes/${created!.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);
    await page.addLocatorHandler(page.getByRole("button", { name: /^skip$/i }), async (b) => {
      await b.click();
    });
    await page.getByRole("button", { name: "ATS score" }).first().click();
    await expect(page.getByTestId("score-breakdown")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("Your full report")).toBeVisible();
    await expect(page.getByText(/\d+ of \d+ checks passed/)).toBeVisible();
    // The old report and its second score are gone.
    await expect(page.getByText(/Detailed report|Every check, one by one/)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Your Score", exact: true }).filter({ visible: true })).toHaveCount(0);
    // Writing checks are listed too (passed or not).
    await expect(page.getByRole("button", { name: /Spelling & grammar/ })).toBeVisible();
    if (process.env.E2E_SHOT_DIR) {
      await page.getByText("Your full report").scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, "ats-panel-report.png") });
    }
  });
});
