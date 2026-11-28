import { expect, test } from "@playwright/test";
import { dismissPopups, resumes, session } from "../fixtures/api";

/**
 * ATS checker → template step: the design closest to the uploaded PDF comes first and is
 * preselected, each card has "Use this template", and the match is saved for a later visit.
 * @real-ai (the ATS check runs on the QA backend).
 */
test("ATS checker template step: closest design first, quick 'Use this template'", async ({ page }) => {
  test.setTimeout(300_000);
  await dismissPopups(page);
  await page.addLocatorHandler(page.getByRole("button", { name: /^skip$/i }), async (b) => {
    await b.click();
  });
  await page.goto("/dashboard/ats-checker");
  // "Upload Your Resume" opens a dialog with the drop zone; choosing a file starts the check.
  await page.getByRole("button", { name: "Upload Your Resume" }).click();
  await page.getByRole("dialog").locator('input[type="file"]').setInputFiles("e2e/fixtures/files/design-dark-sidebar.pdf");
  await page.waitForURL(/ats-checker\?resumeId=/, { timeout: 180_000 });
  const resumeId = new URL(page.url()).searchParams.get("resumeId")!;
  try {
    // The match runs in the background after the report shows; wait until it's saved on the resume.
    await expect
      .poll(async () => {
        const r = (await resumes(page.request, await session(page)).get(resumeId)) as { atsScoringContext?: { designMatch?: { closest: string | null } } };
        return r.atsScoringContext?.designMatch?.closest ?? null;
      }, { timeout: 60_000 })
      .toBe("atlantic-blue");

    // Reopen from the link (as in the report URL): the saved match is used.
    await page.goto(`/dashboard/ats-checker?resumeId=${resumeId}`);
    await page.getByRole("button", { name: "Choose template" }).click({ timeout: 60_000 });
    const first = page.locator("[data-template-id]").first();
    await expect(first).toHaveAttribute("data-template-id", "atlantic-blue", { timeout: 30_000 });
    await expect(first).toHaveAttribute("aria-pressed", "true");
    await expect(first.getByTestId("closest-design")).toBeVisible();

    // Quick apply from another card: applied and on to the next step.
    const other = page.locator("[data-template-id]").nth(1);
    const otherId = await other.getAttribute("data-template-id");
    await other.hover();
    await other.getByRole("button", { name: "Use this template" }).click();
    await expect
      .poll(async () => ((await resumes(page.request, await session(page)).get(resumeId)) as { templateId?: string }).templateId, { timeout: 30_000 })
      .toBe(otherId);
    await expect(page.locator("[data-template-id]")).toHaveCount(0, { timeout: 30_000 });
  } finally {
    await resumes(page.request, await session(page)).remove(resumeId);
  }
});
