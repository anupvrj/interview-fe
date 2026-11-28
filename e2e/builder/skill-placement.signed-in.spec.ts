import { expect, test } from "@playwright/test";
import path from "node:path";
import { API_URL, dismissPopups, fictionalContent, resumes, session, type TestResume } from "../fixtures/api";

/**
 * Orphan skills (listed, never shown in the work) are ADDED in the right place, not swapped in for
 * the skills list. @real-ai: placement and the ATS check run on the QA backend.
 */
const ACCOUNTING = {
  experience: [
    {
      id: "e1", company: "Promotion in Motion, Inc.", position: "Treasurer/Controller", startDate: "2015", endDate: "2019", current: false,
      description: "<ul><li>Reduced A/R collections from 36 to 33 days; improved borrowing terms by lowering interest rates.</li><li>Implemented company-wide 401K plan; reduced insurance exposure and related costs.</li></ul>",
    },
    {
      id: "e2", company: "Taylor, Wolf & Company", position: "Staff Accountant", startDate: "2010", endDate: "2015", current: false,
      description: "<ul><li>Reviewed books and records of bank clients to value collateral for prospective and existing borrowers.</li><li>Evaluated reports used for monitoring bank security.</li></ul>",
    },
  ],
  skills: ["Accounts Payable", "Cash Flow Management", "ADP Payroll", "QuickBooks", "Word"],
};

test("placement API: role skills get a safe place, generic ones stay in Skills @real-ai", async ({ page }) => {
  test.setTimeout(120_000);
  const s = await session(page);
  const entries = ACCOUNTING.experience.map((e, index) => ({
    section: "experience",
    index,
    title: `${e.position} at ${e.company}`,
    bullets: e.description.replace(/<\/li>/g, "\n").replace(/<[^>]+>/g, "").trim().split("\n"),
  }));
  const res = await page.request.post(`${API_URL}/resumes/ai-skill-placement`, {
    headers: { Authorization: `Bearer ${s.token}` },
    data: { skills: ["ADP Payroll", "QuickBooks", "Word"], entries, targetRole: "Assistant Controller", vocabulary: JSON.stringify(ACCOUNTING).toLowerCase() },
  });
  expect(res.status()).toBe(200);
  const { placements } = ((await res.json()) as { data: { placements: Array<{ skill: string; relevant: boolean; place?: { mode: string; text: string; original?: string } }> } }).data;
  console.log(JSON.stringify(placements, null, 1));
  const by = Object.fromEntries(placements.map((p) => [p.skill, p]));
  expect(by["Word"].relevant).toBe(false);
  expect(by["ADP Payroll"].relevant).toBe(true);
  for (const p of placements.filter((x) => x.place)) {
    expect(p.place!.text.toLowerCase()).toContain(p.skill.toLowerCase().split(" ")[0]);
    if (p.place!.mode === "rewrite") for (const n of p.place!.original!.match(/\d+/g) ?? []) expect(p.place!.text).toContain(n);
  }
});

test("editor: an orphan-skills card adds the skill where it belongs @real-ai", async ({ page }, info) => {
  test.setTimeout(300_000);
  const api = resumes(page.request, await session(page));
  const content = { ...fictionalContent("Accounting professional with 9 years in corporate finance and CPA firm roles."), ...ACCOUNTING };
  (content.personalInfo as Record<string, string>).portfolio = "Assistant Controller";
  const r: TestResume = await api.create(`E2E skill placement ${Date.now()}`, content as never);
  try {
    await api.rescore(r.resumeId);
    let placementCalls = 0;
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("/ai-skill-placement")) placementCalls++;
    });
    await page.goto(`/dashboard/resumes/${r.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);
    await page.getByRole("button", { name: "ATS score" }).first().click();
    await page.waitForTimeout(4000);
    // The ATS tour is a modal over the page: close it like a user (Esc).
    for (let i = 0; i < 3 && (await page.getByRole("dialog", { name: "Editor tour" }).count()); i++) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
    // As a user would: click the red box on "QuickBooks" in Skills → its card opens on the left.
    const at = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const i = n.textContent?.indexOf("QuickBooks") ?? -1;
        if (i < 0 || !(n.parentElement?.closest(".resume-page"))) continue;
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + "QuickBooks".length);
        const box = r.getBoundingClientRect();
        if (box.width > 0 && box.top > 0 && box.top < window.innerHeight) return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      }
      return null;
    });
    expect(at).not.toBeNull();
    await page.mouse.click(at!.x, at!.y);
    const box = page.getByTestId("skill-placement").first();
    // Orphan skills are found in code now, so the card is always there for this resume.
    await expect(box).toBeAttached({ timeout: 45_000 });
    await box.scrollIntoViewIfNeeded();
    const action = box.getByRole("button", { name: /Add here if true|Update this line/ }).first();
    await expect(action).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(1500); // a beat to see the card before applying (headed runs)
    await action.click();
    await page.waitForTimeout(2500); // the green flash on the page
    await expect(box.getByText(/Added — check it on the page/).first()).toBeVisible();
    if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, "skill-placement.png") });

    // The box stays put after the add and the live re-score: no reset, no second AI call.
    await page.waitForTimeout(6000);
    await expect(box).toBeVisible();
    await expect(box.getByText(/Added — check it on the page/).first()).toBeVisible();
    await expect(box.getByText("Finding where each skill fits")).toHaveCount(0);
    expect(placementCalls).toBe(1);

    // Close the panel and open it again: the suggestions come back without asking the AI again.
    await page.getByRole("button", { name: "Close panel" }).first().click();
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: "ATS score" }).first().click();
    const row = page.getByRole("button", { name: /Skills backed by your work/ });
    if ((await row.getAttribute("aria-expanded")) !== "true") await row.click();
    const again = page.getByTestId("skill-placement").first();
    await expect(again).toBeVisible({ timeout: 15_000 });
    expect(placementCalls).toBe(1);

    // "Not relevant" on a skill: saved on the resume, gone from the finding, also after a reload.
    const skip = again.getByRole("button", { name: "Not relevant" }).first();
    if (await skip.count()) {
      const skillName = ((await skip.getAttribute("title")) ?? "").replace(/^Don't suggest | again for this resume$/g, "");
      await skip.click();
      await expect(again.getByText(/Won.t suggest again/)).toBeVisible({ timeout: 15_000 });
      if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, "skill-not-relevant.png") });
      const saved = (await resumes(page.request, await session(page)).get(r.resumeId)) as {
        atsIgnoredIssues?: Array<{ skill?: string }>;
        atsFeedback?: { categories?: Record<string, { checks: Array<{ id: string; issues: Array<{ title?: string; excerpt?: string }> }> }> };
      };
      expect((saved.atsIgnoredIssues ?? []).map((i) => i.skill)).toContain(skillName);
      const orphan = Object.values(saved.atsFeedback?.categories ?? {})
        .flatMap((c) => c.checks)
        .find((c) => c.id === "skillEvidence")
        ?.issues.find((i) => /not shown in your work/i.test(i.title ?? ""));
      expect(orphan?.excerpt ?? "").not.toContain(skillName);
      await page.reload();
      await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
      await expect(page.getByTestId("skill-placement").getByText(skillName, { exact: true })).toHaveCount(0);
    }
    // The skills list itself is untouched; the skill now shows in the work.
    await expect
      .poll(async () => JSON.stringify(((await resumes(page.request, await session(page)).get(r.resumeId)) as { content?: { experience?: unknown } }).content?.experience ?? ""), { timeout: 30_000 })
      .toMatch(/ADP|QuickBooks|accounts payable|cash flow/i);
    void info;
  } finally {
    await resumes(page.request, await session(page)).remove(r.resumeId);
  }
});
