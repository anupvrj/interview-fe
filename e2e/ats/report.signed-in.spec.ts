import { expect, test } from "@playwright/test";
import { fictionalContent, resumes, session, type TestResume } from "../fixtures/api";

/**
 * Real scoring against the local backend (one small AI call per check), tagged @real-ai.
 * Uses a fictional resume and deletes it afterwards.
 */
test.describe("signed-in ATS report @real-ai", () => {
  test.describe.configure({ timeout: 300_000 });
  let created: TestResume | undefined;
  let api: ReturnType<typeof resumes>;

  test.beforeEach(async ({ page, request }) => {
    api = resumes(request, await session(page));
    created = await api.create(`E2E ATS ${Date.now()}`);
  });
  test.afterEach(async () => {
    if (created) await api.remove(created.resumeId);
  });

  test("same resume, same score; history records each full check", async () => {
    const first = await api.rescore(created!.resumeId);
    const again = await api.rescore(created!.resumeId);
    expect(typeof first.atsScore).toBe("number");
    expect(again.atsScore).toBe(first.atsScore);
    const history = await api.history(created!.resumeId);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history.length).toBeLessThanOrEqual(20);
  });

  test("report page shows the score and the progress card after a change", async ({ page }) => {
    await api.rescore(created!.resumeId);
    const better = "Marketing manager who led 12 launches and grew qualified leads 38% using Google Ads, HubSpot and SEO.";
    await api.update(created!.resumeId, { content: fictionalContent(better), profileSummary: `<p>${better}</p>` });
    await api.rescore(created!.resumeId);

    await page.goto(`/dashboard/ats-checker?resumeId=${created!.resumeId}`);
    await expect(page.getByText(/your progress/i)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("img", { name: /ATS score over \d+ checks/i })).toBeVisible();
  });

  test("editor opens on the ATS panel from ?view=ats", async ({ page }) => {
    await api.rescore(created!.resumeId);
    await page.goto(`/dashboard/resumes/${created!.resumeId}/edit?view=ats`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText(/ATS/).first()).toBeVisible();
  });

  test("job keywords: missing skills listed, and 'Add in editor' opens the job panel", async ({ page }) => {
    const jd =
      "Marketing Manager. Must have: Google Ads, HubSpot, Salesforce, Marketo and SQL. " +
      "Nice to have: Tableau and Figma. You will run B2B campaigns and report on pipeline.";
    await api.rescore(created!.resumeId, jd);
    await page.goto(`/dashboard/ats-checker?resumeId=${created!.resumeId}`);
    const card = page.locator('section[aria-labelledby="ats-keywords-title"]');
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(card).toContainText(/skills from the job aren't clear on your resume/);
    await expect(card).toContainText("Salesforce");
    await card.getByRole("link", { name: /add in editor/i }).click();
    await expect(page).toHaveURL(/\/edit\?view=job/);
    await expect(page.getByText("Keywords from the job").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
  });

  test("'How this score works' shows the weights used and the honest framing", async ({ page }) => {
    await api.rescore(created!.resumeId);
    await page.goto(`/dashboard/ats-checker?resumeId=${created!.resumeId}`);
    const toggle = page.getByRole("button", { name: /how this score works/i });
    await expect(toggle).toBeVisible({ timeout: 60_000 });
    await toggle.click();
    const panel = page.locator("#ats-score-explainer");
    await expect(panel).toContainText("InterviewTrix's estimate");
    await expect(panel).toContainText("Content");
    await expect(panel).toContainText(/\d+%/);
  });

  test("editor's detailed report uses the same pieces: score explainer and job keywords", async ({ page }) => {
    const jd =
      "Marketing Manager. Must have: Google Ads, HubSpot, Salesforce and SQL. Nice to have: Tableau. Run B2B campaigns and report on pipeline.";
    await api.rescore(created!.resumeId, jd);
    await page.goto(`/dashboard/resumes/${created!.resumeId}/edit?view=ats`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await page.keyboard.press("Escape");
    const detailed = page.getByRole("button", { name: /detailed report/i });
    await expect(detailed).toBeVisible({ timeout: 30_000 });
    await detailed.click();
    await expect(page.getByRole("button", { name: /how this score works/i }).filter({ visible: true })).toBeVisible();
    const keywords = page.locator('section[aria-labelledby="ats-keywords-title"]').filter({ visible: true });
    await expect(keywords).toContainText("Salesforce");
    await expect(page.getByText(/unlock job match insights/i)).toHaveCount(0);
  });
});
