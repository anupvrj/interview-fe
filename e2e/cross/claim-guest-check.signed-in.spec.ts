import { expect, test } from "@playwright/test";
import { resumes, session } from "../fixtures/api";

/**
 * A real signed-out ATS check, then signing in: the check becomes a resume in the account
 * and opens in the editor on the ATS panel. Fictional resume; one real AI scoring. @real-ai
 */
test("a guest ATS check is claimed after sign-in @real-ai", async ({ browser, page, request }) => {
  test.setTimeout(300_000);
  const guestContext = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const guest = await guestContext.newPage();
  await guest.goto("/ats-checker");
  // the upload dialog opens first (it can take a job description), then the file input
  await guest.getByRole("button", { name: /upload your resume/i }).first().click();
  await guest.locator('input[type="file"]').setInputFiles("e2e/fixtures/files/btech-student.pdf");
  await expect(guest.getByRole("button", { name: /upload new/i }).first()).toBeVisible({ timeout: 240_000 });
  const stored = await guest.evaluate(() =>
    Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith("ats-checker-guest")).map((k) => [k, localStorage.getItem(k)!])),
  );
  await guestContext.close();
  expect(Object.keys(stored)).toContain("ats-checker-guest-token");

  const api = resumes(request, await session(page));
  await page.evaluate((entries) => {
    for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v);
  }, stored);
  await page.goto("/dashboard/ats-checker");
  await expect(page).toHaveURL(/\/dashboard\/resumes\/[^/]+\/edit\?view=ats/, { timeout: 90_000 });
  const resumeId = page.url().match(/resumes\/([^/]+)\/edit/)![1];
  try {
    const saved = await api.get(resumeId);
    expect(typeof saved.atsScore).toBe("number");
    expect(await page.evaluate(() => localStorage.getItem("ats-checker-guest-token"))).toBeNull();
  } finally {
    await api.remove(resumeId);
  }
});
