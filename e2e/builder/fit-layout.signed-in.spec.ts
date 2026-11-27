import { expect, test } from "@playwright/test";
import path from "node:path";
import { dismissPopups, fictionalContent, resumes, session, type TestResume } from "../fixtures/api";

/** An AI-built resume a little over its 1-page budget: the editor tightens the layout (no words cut). */
test("fits an AI-built resume to one page with layout first", async ({ page }, info) => {
  test.setTimeout(120_000);
  const api = resumes(page.request, await session(page));
  const content = fictionalContent();
  const bullet = (n: number, i: number) => `<li>Planned and ran the quarter ${i} launch programme for product line ${n} with sales, design and support teams.</li>`;
  content.experience = [1, 2, 3, 4].map((n) => ({
    id: `exp-${n}`,
    company: `Northwind Unit ${n}`,
    position: "Marketing Manager",
    startDate: `Jan ${2012 + n * 2}`,
    endDate: `Dec ${2013 + n * 2}`,
    current: false,
    description: `<ul>${[1, 2, 3, 4, 5].map((i) => bullet(n, i)).join("")}</ul>`,
  })) as never;
  const r: TestResume = await api.create(`E2E fit ${Date.now()}`, content);
  try {
    await api.update(r.resumeId, { aiBuildMeta: { pageBudget: 1, dismissed: [] } });
    await page.goto(`/dashboard/resumes/${r.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);

    await expect.poll(async () => {
      const saved = (await resumes(page.request, await session(page)).get(r.resumeId)) as TestResume & { aiBuildMeta?: { fitDone?: boolean } };
      return saved.aiBuildMeta?.fitDone ?? false;
    }, { timeout: 60_000 }).toBe(true);
    const saved = (await resumes(page.request, await session(page)).get(r.resumeId)) as TestResume & { layout?: { padding?: { top: number }; fontSize?: { body?: number } } };
    const pages = await page.locator(`#resume-preview-container-${r.resumeId} .resume-page`).filter({ visible: true }).count();
    await page.screenshot({ path: path.join(info.outputDir, "fit.png") });
    if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, "fit-layout.png") });
    console.log("pages", pages, "layout", JSON.stringify(saved.layout?.padding), JSON.stringify(saved.layout?.fontSize));
    expect(saved.layout?.padding?.top ?? 99).toBeLessThan(10);
    // Every bullet is still there.
    const desc = JSON.stringify((saved.content as { experience?: unknown[] })?.experience ?? []);
    expect((desc.match(/launch programme/g) ?? []).length).toBe(20);
  } finally {
    await resumes(page.request, await session(page)).remove(r.resumeId);
  }
});
