import { expect, test } from "@playwright/test";
import JSZip from "jszip";
import fs from "node:fs";
import { dismissPopups, resumes, session, type TestResume } from "../fixtures/api";

/** The Word download follows the template picked in the editor, not the one the resume started with. */
test("Word download uses the newly chosen template's design", async ({ page }) => {
  test.setTimeout(180_000);
  const api = resumes(page.request, await session(page));
  const r: TestResume = await api.create(`E2E word template ${Date.now()}`); // starts on condensed-rule (Calibri)
  try {
    await page.goto(`/dashboard/resumes/${r.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);
    await page.addLocatorHandler(page.getByRole("button", { name: /^skip$/i }), async (b) => {
      await b.click();
    });

    // Switch to Atlantic Blue (Zilla Slab, navy, shaded section headings).
    await page.getByRole("button", { name: "Designs" }).first().click();
    await page.getByRole("button", { name: "Apply Atlantic Blue" }).click();
    await expect(page.locator(".resume-page").filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1500);

    await page.getByRole("button", { name: "Download" }).first().click();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /word/i }).click()]);
    const file = await download.path();
    const zip = await JSZip.loadAsync(fs.readFileSync(file!));
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain('w:ascii="Zilla Slab"');
    expect(xml).not.toContain('w:ascii="Calibri"');
    expect(xml).toContain("w:shd"); // shaded section headings, as on the design
  } finally {
    await resumes(page.request, await session(page)).remove(r.resumeId);
  }
});
