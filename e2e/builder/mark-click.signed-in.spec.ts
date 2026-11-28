import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { dismissPopups, fictionalContent, resumes, session, type TestResume } from "../fixtures/api";

/**
 * Clicking a red-outlined finding on the resume opens its explanation on the left (the card is
 * picked and scrolled into view) — in the editor and on the ATS checker page. @real-ai (ATS check).
 */
async function clickFirstMark(page: Page, boxSelector: string) {
  const box = page.locator(boxSelector).filter({ visible: true }).first();
  await expect(box).toBeVisible({ timeout: 60_000 });
  const b = (await box.boundingBox())!;
  await page.mouse.click(b.x + Math.min(12, b.width / 2), b.y + b.height / 2);
}

test.describe("clicking a marked finding", () => {
  let created: TestResume | undefined;
  test.beforeEach(async ({ page }) => {
    const api = resumes(page.request, await session(page));
    const content = fictionalContent();
    content.experience[0].description =
      "<ul><li>Organised campaigns for the brand team and organised campaign budgets and organised campaign reports</li>" +
      "<li>Responsible for search campaigns and reports for the team</li></ul>";
    created = await api.create(`E2E mark click ${Date.now()}`, content);
    await api.rescore(created.resumeId);
  });
  test.afterEach(async ({ page }) => {
    if (created) await resumes(page.request, await session(page)).remove(created.resumeId);
  });

  test("editor: the finding's card opens on the left", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(`/dashboard/resumes/${created!.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);
    await page.addLocatorHandler(page.getByRole("button", { name: /^skip$/i }), async (b) => {
      await b.click();
    });
    await page.getByRole("button", { name: "ATS score" }).first().click();
    await expect(page.locator('[data-guide="ats-finding"]').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-guide="ats-finding"][data-active]')).toHaveCount(0);
    // A red box on the page (error/weak marks use the rose border).
    await clickFirstMark(page, '[data-rx-mark="error"], [data-rx-mark="weak"]');
    const active = page.locator('[data-guide="ats-finding"][data-active]');
    await expect(active).toHaveCount(1, { timeout: 10_000 });
    await expect(active).toBeInViewport();
    // …at the top of the panel, not at its bottom edge.
    await expect
      .poll(
        () =>
          active.evaluate((card) => {
            let el: HTMLElement | null = card.parentElement;
            while (el && !/(auto|scroll)/.test(getComputedStyle(el).overflowY)) el = el.parentElement;
            return el ? Math.round(card.getBoundingClientRect().top - el.getBoundingClientRect().top) : 9999;
          }),
        { timeout: 5_000 },
      )
      .toBeLessThan(40);
    if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, "mark-click-editor.png") });
  });

  test("ATS checker page: the finding's explanation is shown", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(`/dashboard/ats-checker?resumeId=${created!.resumeId}`);
    await dismissPopups(page);
    const marks = page.getByRole("button", { name: "Show this issue in the report" });
    await expect(marks.first()).toBeAttached({ timeout: 90_000 });
    // A mark in view (the preview's sticky header can cover the top one).
    const mark = marks.last();
    await mark.scrollIntoViewIfNeeded();
    const b = (await mark.boundingBox())!;
    await page.mouse.click(b.x + Math.min(10, b.width / 2), b.y + b.height / 2);
    // The explanation (with how to fix it) is scrolled into view, not just picked in the list.
    await expect(page.getByText(/HIGHLIGHTED/).first()).toBeInViewport({ timeout: 10_000 });
    if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, "mark-click-ats-page.png") });
  });
});
