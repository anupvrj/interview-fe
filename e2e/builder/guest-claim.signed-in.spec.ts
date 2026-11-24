import { expect, test } from "@playwright/test";
import { fictionalContent, resumes, session } from "../fixtures/api";

/** After sign-up, the draft built signed out becomes a resume in the account. */
test("a guest draft is saved to the account and opened in the editor", async ({ page, request }) => {
  const s = await session(page);
  const api = resumes(request, s);
  await page.evaluate((content) => {
    localStorage.setItem(
      "ix-guest-resume-draft",
      JSON.stringify({
        data: { templateId: "condensed-rule", content, sectionOrder: [], source: "scratch", savedAt: Date.now() },
        expiresAt: Date.now() + 60 * 60 * 1000,
      }),
    );
  }, fictionalContent("Guest draft summary for the claim test."));

  await page.goto("/dashboard/resumes/new?draft=guest");
  await expect(page).toHaveURL(/\/dashboard\/resumes\/[^/]+\/edit/, { timeout: 60_000 });
  const resumeId = page.url().match(/resumes\/([^/]+)\/edit/)![1];
  try {
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    expect(await page.evaluate(() => localStorage.getItem("ix-guest-resume-draft"))).toBeNull();
  } finally {
    await api.remove(resumeId);
  }
});
