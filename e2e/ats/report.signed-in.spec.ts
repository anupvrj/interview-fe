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
});
