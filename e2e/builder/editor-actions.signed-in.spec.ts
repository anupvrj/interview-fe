import { expect, test } from "@playwright/test";
import { dismissPopups, resumes, session, type TestResume } from "../fixtures/api";

test.describe("editor actions", () => {
  let created: TestResume | undefined;
  let api: ReturnType<typeof resumes>;

  test.beforeEach(async ({ page, request }) => {
    api = resumes(request, await session(page));
    created = await api.create(`E2E actions ${Date.now()}`);
    await page.goto(`/dashboard/resumes/${created.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);
  });
  test.afterEach(async () => {
    if (created) await api.remove(created.resumeId);
  });

  test("switching the design saves it and keeps the content", async ({ page }) => {
    await page.getByRole("button", { name: /^designs$/i }).click();
    const apply = page.getByRole("button", { name: /^apply /i }).filter({ visible: true }).first();
    await expect(apply).toBeVisible({ timeout: 30_000 });
    const label = (await apply.getAttribute("aria-label")) ?? "";
    await apply.click();
    await expect.poll(async () => (await api.get(created!.resumeId)).templateId, { timeout: 30_000 }).not.toBe("condensed-rule");
    await page.reload();
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Northwind Labs").filter({ visible: true }).first()).toBeVisible();
    expect(label).toMatch(/^Apply /);
  });

  test("Download PDF gives a real PDF (free plan)", async ({ page }) => {
    test.setTimeout(180_000);
    await page.getByRole("button", { name: /^export$/i }).click();
    let downloaded: import("@playwright/test").Download | null = null;
    page.once("download", (d) => {
      downloaded = d;
    });
    await page.getByRole("dialog", { name: /download your resume/i }).getByRole("button", { name: /^download pdf$/i }).click();
    // Two dialogs can appear in any order: "Give your resume a final read" (once, before the
    // first download) and the trial offer (on a timer). Answer whichever is up until it downloads.
    const deadline = Date.now() + 150_000;
    while (!downloaded && Date.now() < deadline) {
      const later = page.getByRole("button", { name: /^maybe later$/i });
      if (await later.isVisible().catch(() => false)) await later.click().catch(() => {});
      const finalRead = page.getByRole("button", { name: /^download$/i }).filter({ visible: true });
      if (await finalRead.first().isVisible().catch(() => false)) await finalRead.first().click().catch(() => {});
      await page.waitForTimeout(500);
    }
    expect(downloaded, "the PDF should download").not.toBeNull();
    const download = Promise.resolve(downloaded!);
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.pdf$/);
    const chunks: Buffer[] = [];
    for await (const c of await file.createReadStream()) chunks.push(c as Buffer);
    const bytes = Buffer.concat(chunks);
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(5000);
  });
});
