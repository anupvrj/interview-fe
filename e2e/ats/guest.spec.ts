import { expect, test, type Page } from "@playwright/test";
import { ATS_PREVIEW_API, RECORD, files, replayApi } from "../fixtures/recorded-api";

/** Signed-out ATS check: upload → scan → report → keep it through refresh → start over. */

async function uploadResume(page: Page, file: string | { name: string; mimeType: string; buffer: Buffer }) {
  await page.getByRole("button", { name: /upload your resume/i }).first().click();
  await page.locator('input[type="file"]').setInputFiles(file);
}

/** "Upload new" only exists on a result (the landing page's demo also says "ATS REPORT"). */
const uploadNew = (page: Page) => page.getByRole("button", { name: /upload new/i });

async function waitForReport(page: Page) {
  await expect(uploadNew(page).first()).toBeVisible({ timeout: RECORD ? 180_000 : 45_000 });
}

test.describe("ATS checker, signed out", () => {
  test.beforeEach(async ({ page }) => {
    await replayApi(page, "ats-guest-marketing-manager", ATS_PREVIEW_API);
    await page.goto("/ats-checker");
  });

  test("gives a score with no account, keeps some findings for sign-up @mobile", async ({ page }) => {
    await uploadResume(page, files.marketingManager);
    await waitForReport(page);
    await expect(page.getByText(/\d+ more findings? (is|are) locked/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /fix my resume, free/i }).last()).toHaveAttribute("href", /\/sign-up\?redirect_url=/);
    if (RECORD) {
      // Let the improved version arrive so the recording includes it.
      await expect(page.getByLabel("Ready").first()).toBeVisible({ timeout: 120_000 });
    }
  });

  test("keeps the report through a refresh, and Upload new starts over", async ({ page }) => {
    await uploadResume(page, files.marketingManager);
    await waitForReport(page);
    await page.reload();
    await waitForReport(page);
    await uploadNew(page).first().click();
    await expect(page.getByRole("button", { name: /upload your resume/i }).first()).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: /upload your resume/i }).first()).toBeVisible();
    await expect(uploadNew(page)).toHaveCount(0);
  });

  test("refuses a file over the size limit, with a clear message", async ({ page }) => {
    await uploadResume(page, {
      name: "huge.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(3 * 1024 * 1024, 0x20)]),
    });
    await expect(page.getByText(/file size must be less than/i)).toBeVisible();
    await expect(uploadNew(page)).toHaveCount(0);
  });

  test("refuses a file that isn't a PDF", async ({ page }) => {
    await uploadResume(page, { name: "photo.png", mimeType: "image/png", buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]) });
    await expect(page.getByText(/pdf/i).filter({ hasText: /only|must|allowed|upload a pdf/i }).first()).toBeVisible();
    await expect(uploadNew(page)).toHaveCount(0);
  });
});
