import { expect, test } from "@playwright/test";
import { dismissPopups, resumes, session } from "../fixtures/api";

/** Signed-in pages people use on phones: dashboard, report, editor. No sideways scrolling. */
test("dashboard, ATS report and editor fit a phone @real-ai", async ({ page, request }) => {
  test.setTimeout(240_000);
  const api = resumes(request, await session(page));
  const r = await api.create(`E2E phone ${Date.now()}`);
  try {
    await api.rescore(r.resumeId);
    await page.setViewportSize({ width: 375, height: 812 });
    const fits = async () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
    await page.goto("/dashboard/resumes");
    await expect(page.getByRole("main").first()).toBeVisible();
    expect(await fits()).toBe(true);
    await page.goto(`/dashboard/ats-checker?resumeId=${r.resumeId}`);
    await expect(page.getByRole("button", { name: /how this score works/i })).toBeVisible({ timeout: 60_000 });
    expect(await fits()).toBe(true);
    await page.goto(`/dashboard/resumes/${r.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);
    expect(await fits()).toBe(true);
  } finally {
    await api.remove(r.resumeId);
  }
});
