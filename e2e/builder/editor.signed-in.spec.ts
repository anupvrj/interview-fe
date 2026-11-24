import { expect, test } from "@playwright/test";
import { fictionalContent, resumes, session, type TestResume } from "../fixtures/api";

test.describe("resume editor", () => {
  let created: TestResume | undefined;
  let api: ReturnType<typeof resumes>;

  test.beforeEach(async ({ page, request }) => {
    api = resumes(request, await session(page));
    created = await api.create(`E2E editor ${Date.now()}`);
  });
  test.afterEach(async () => {
    if (created) await api.remove(created.resumeId);
  });

  test("opens a resume and shows its content", async ({ page }) => {
    await page.goto(`/dashboard/resumes/${created!.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Northwind Labs").filter({ visible: true }).first()).toBeVisible();
  });

  test("Word download is offered free and gives a .docx", async ({ page }) => {
    await page.goto(`/dashboard/resumes/${created!.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await page.getByRole("button", { name: /^export$/i }).click();
    await expect(page.getByRole("dialog", { name: /download your resume/i })).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /download word \(\.docx\), free/i }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.docx$/);
    const stream = await file.createReadStream();
    const chunks: Buffer[] = [];
    for await (const c of stream) chunks.push(c as Buffer);
    const bytes = Buffer.concat(chunks);
    expect(bytes.subarray(0, 2).toString()).toBe("PK"); // a real .docx is a zip
    expect(bytes.length).toBeGreaterThan(3000);
  });

  test("an edit saved through the API shows after reload", async ({ page }) => {
    const summary = "Growth marketer who ships campaigns weekly.";
    // The editor saves the summary in both places; do the same.
    await api.update(created!.resumeId, { title: "E2E renamed", content: fictionalContent(summary), profileSummary: `<p>${summary}</p>` });
    await page.goto(`/dashboard/resumes/${created!.resumeId}/edit`);
    await expect(page.getByText("Growth marketer who ships campaigns weekly.").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
  });
});
