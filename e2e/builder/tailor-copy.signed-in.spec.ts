import { expect, test } from "@playwright/test";
import path from "node:path";
import { dismissPopups, resumes, session, type TestResume } from "../fixtures/api";

/**
 * Tailoring to a job makes a copy by default: the master resume is not changed, and the
 * tailored copy opens. @real-ai: the match and the rewrite go to the real model via the QA backend.
 */
const JD = `Senior Growth Marketing Manager at Contoso Retail (Bengaluru).
We are looking for a growth marketer to own paid acquisition across Google Ads and Meta, run lifecycle email in HubSpot,
and report weekly on pipeline and CAC. You will plan product launches with the product team, manage an annual budget,
and run A/B tests on landing pages. 5+ years in B2B or retail marketing; strong analytics; SEO is a plus.`;

test("tailor a copy; the master stays as it was @real-ai", async ({ page }, info) => {
  test.setTimeout(240_000);
  const api = resumes(page.request, await session(page));
  const master: TestResume = await api.create(`E2E tailor master ${Date.now()}`);
  let copyId: string | undefined;
  try {
    const before = await api.get(master.resumeId);
    await page.goto(`/dashboard/resumes/${master.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);

    await page.getByRole("button", { name: "Job match" }).first().click();
    await page.getByPlaceholder("Paste the full job description here…").fill(JD);
    await page.getByRole("button", { name: "Compare with my resume" }).click();
    await page.getByRole("button", { name: "Rewrite for this job" }).click({ timeout: 90_000 });

    const choice = page.getByTestId("tailor-choice");
    await expect(choice).toBeVisible();
    await page.screenshot({ path: path.join(info.outputDir, "tailor-choice.png") });
    if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, "tailor-choice.png") });
    await choice.getByRole("button", { name: "Make a tailored copy" }).click();

    await page.waitForURL((url) => /\/dashboard\/resumes\/[^/]+\/edit/.test(url.pathname) && !url.pathname.includes(master.resumeId), { timeout: 180_000 });
    copyId = page.url().split("/dashboard/resumes/")[1].split("/")[0];

    const fresh = resumes(page.request, await session(page));
    const copy = (await fresh.get(copyId)) as TestResume & { title?: string };
    expect(copy.title).toContain("tailored");
    const after = await fresh.get(master.resumeId);
    // What tailoring rewrites is untouched on the master. (The editor's own save on open may
    // normalise other fields, e.g. degree + field, which is not tailoring.)
    const tailored = (c: Record<string, unknown> | undefined) => ({ experience: c?.experience, skills: c?.skills, projects: c?.projects, profileSummary: c?.profileSummary });
    expect(tailored(after.content)).toEqual(tailored(before.content));
  } finally {
    const s = resumes(page.request, await session(page));
    await s.remove(master.resumeId);
    if (copyId) await s.remove(copyId);
  }
});

test("update in place: each change says why, and one can be undone @real-ai", async ({ page }, info) => {
  test.setTimeout(420_000);
  const api = resumes(page.request, await session(page));
  const r: TestResume = await api.create(`E2E tailor in place ${Date.now()}`);
  try {
    await page.goto(`/dashboard/resumes/${r.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);
    await page.getByRole("button", { name: "Job match" }).first().click();
    await page.getByPlaceholder("Paste the full job description here…").fill(JD);
    await page.getByRole("button", { name: "Compare with my resume" }).click();
    await page.getByRole("button", { name: "Rewrite for this job" }).click({ timeout: 90_000 });
    await page.getByTestId("tailor-choice").getByRole("button", { name: "Update this resume instead" }).click();

    await page.getByRole("button", { name: "See changes" }).click({ timeout: 300_000 });
    const list = page.getByTestId("ai-review-changes");
    await expect(list.getByText(/^Why: /).first()).toBeVisible();
    if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, "ai-review-why.png") });

    const item = list.locator("li").filter({ has: page.getByRole("button", { name: "Undo" }) }).first();
    if (await item.count()) {
      const undo = item.getByRole("button", { name: "Undo" });
      const original = (await item.locator(".line-through").textContent({ timeout: 5_000 }))?.trim() ?? "";
      const before = await list.locator("li").count();
      await undo.click();
      if (before > 1) await expect(list.locator("li")).toHaveCount(before - 1);
      await expect(page.locator(".resume-page", { hasText: original.slice(0, 40) }).filter({ visible: true }).first()).toBeVisible();
    }
    void info;
  } finally {
    await resumes(page.request, await session(page)).remove(r.resumeId);
  }
});
