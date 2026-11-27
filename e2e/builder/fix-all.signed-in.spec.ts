import { expect, test } from "@playwright/test";
import path from "node:path";
import { dismissPopups, fictionalContent, resumes, session, type TestResume } from "../fixtures/api";

/**
 * "Fix all with AI" in the editor's ATS panel. The rewrite itself (v2 with the ATS findings) is
 * covered by interview-core's fixAllCheck script; this checks the button and the plan gate.
 */
test("Fix all with AI: shown with the ATS findings; without the plan it offers the upgrade", async ({ page }, info) => {
  test.setTimeout(420_000);
  const api = resumes(page.request, await session(page));
  const content = fictionalContent();
  // Deliberately weak: duty openers, the same verb and noun over and over.
  content.experience[0].description =
    "<ul><li>Responsible for managing campaigns for the brand team and managing campaign budgets</li>" +
    "<li>Responsible for managing campaigns on search and managing campaign reports every week</li>" +
    "<li>Worked on managing campaigns for product launches with the sales team</li>" +
    "<li>Helped with managing campaigns for events and managing campaign calendars</li></ul>";
  const r: TestResume = await api.create(`E2E fix all ${Date.now()}`, content);
  try {
    const scored = await api.rescore(r.resumeId);
    await page.goto(`/dashboard/resumes/${r.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);
    // The ATS panel's first-visit tour.
    await page.addLocatorHandler(page.getByRole("button", { name: /^skip$/i }), async (b) => {
      await b.click();
    });
    await page.getByRole("button", { name: "ATS score" }).first().click();
    const fixAll = page.getByTestId("fix-all").getByRole("button", { name: "Fix all with AI" });
    await expect(fixAll).toBeVisible({ timeout: 60_000 });
    if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, "fix-all-before.png") });
    await fixAll.click();
    // The test account has no plan with the one-click optimizer: the upgrade offer opens instead.
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
    if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, "fix-all-upsell.png") });
    void scored;
  } finally {
    await resumes(page.request, await session(page)).remove(r.resumeId);
  }
});
