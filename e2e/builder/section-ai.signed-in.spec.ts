import { expect, test } from "@playwright/test";
import path from "node:path";
import { dismissPopups, fictionalContent, resumes, session, type TestResume } from "../fixtures/api";

/** ✦ on a section: tailored chips, preview, Apply. Facts kept, nothing invented. @real-ai */
test("section AI: rewrite Experience with a chip, preview, apply @real-ai", async ({ page }, info) => {
  test.setTimeout(240_000);
  const api = resumes(page.request, await session(page));
  const r: TestResume = await api.create(`E2E section AI ${Date.now()}`, fictionalContent());
  try {
    await page.goto(`/dashboard/resumes/${r.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);
    await page.waitForTimeout(2500);
    for (let i = 0; i < 3 && (await page.getByRole("dialog", { name: "Editor tour" }).count()); i++) await page.keyboard.press("Escape");

    // Hover the job: the gutter shows ＋, ✦ and ⋮⋮.
    await page.locator(".resume-page li", { hasText: "product launches" }).filter({ visible: true }).first().hover();
    const ai = page.getByRole("button", { name: "Write or rewrite with AI" });
    await expect(ai).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(800);
    await ai.click();

    const dialog = page.getByTestId("section-ai");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Lead each job with its biggest result" })).toBeVisible();
    await page.waitForTimeout(800);
    await dialog.getByRole("button", { name: "Lead each job with its biggest result" }).click();
    await dialog.getByRole("button", { name: "Rewrite it" }).click();
    const preview = dialog.getByTestId("section-ai-preview");
    await expect(preview).toBeVisible({ timeout: 90_000 });
    await expect(preview).toContainText(/38%/); // the real number is kept
    await page.waitForTimeout(1500);
    if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, "section-ai-preview.png") });
    await dialog.getByRole("button", { name: "Apply" }).click();
    await expect(dialog).toBeHidden();
    await page.waitForTimeout(2000);
    await expect
      .poll(async () => JSON.stringify(((await resumes(page.request, await session(page)).get(r.resumeId)) as { content?: { experience?: unknown } }).content?.experience ?? ""), { timeout: 30_000 })
      .toMatch(/38%/);
    void info;
  } finally {
    await resumes(page.request, await session(page)).remove(r.resumeId);
  }
});
