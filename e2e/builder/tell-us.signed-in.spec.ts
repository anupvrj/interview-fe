import { expect, test } from "@playwright/test";
import path from "node:path";
import { dismissPopups, resumes, session, type TestResume } from "../fixtures/api";

/**
 * Nothing real to improve (near-empty resume): "Fix all with AI" asks for the facts instead —
 * here by pasting — and writes the resume from them, keeping the design. @real-ai
 */
const PASTED = `Priya Test — Data Analyst
Northwind Foods, Data Analyst, Jun 2021 – Present
- Built weekly sales dashboards in Power BI for 40 store managers
- Wrote SQL reports on stock levels and supplier delays
- Automated the monthly demand forecast in Python, cutting prep from 3 days to 1
Education: B.Tech Computer Science, JNTU Hyderabad, 2017–2021
Skills: SQL, Python, Power BI, Excel`;

test("thin resume: Fix all asks for the facts, then writes the resume from them @real-ai", async ({ page }) => {
  test.setTimeout(300_000);
  const api = resumes(page.request, await session(page));
  const r: TestResume = await api.create(`E2E tell us ${Date.now()}`, {
    personalInfo: { fullName: "Priya Test", email: "priya.test@northwind.invalid", phone: "+91 98201 11111" },
    profileSummary: "<p>Analyst.</p>",
    experience: [{ id: "e1", company: "Northwind Foods", position: "Data Analyst", startDate: "2021-06", current: true, description: "<ul><li>Dashboards.</li></ul>" }],
    education: [],
    skills: ["SQL"],
  } as never);
  try {
    await api.rescore(r.resumeId);
    await page.goto(`/dashboard/resumes/${r.resumeId}/edit`);
    await expect(page.getByText("Priya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);
    await page.getByRole("button", { name: "ATS score" }).first().click();
    await page.waitForTimeout(3000);
    for (let i = 0; i < 3 && (await page.getByRole("dialog", { name: "Editor tour" }).count()); i++) await page.keyboard.press("Escape");

    await page.getByTestId("fix-all").getByRole("button", { name: "Fix all with AI" }).click({ timeout: 60_000 });
    const dialog = page.getByTestId("tell-us-about-you");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Answer a few questions")).toBeVisible();
    await expect(dialog.getByText("Just talk")).toBeVisible();
    await page.waitForTimeout(1200);
    await dialog.getByText("Paste what you have").click();
    await dialog.getByLabel("Your details").fill(PASTED);
    await page.waitForTimeout(800);
    await dialog.getByRole("button", { name: "Write my resume" }).click();
    await expect(dialog).toBeHidden({ timeout: 200_000 });
    await expect(page.locator(".resume-page", { hasText: "Power BI" }).filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2500);
    if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, "tell-us-after.png") });
    // Saved: the real facts are on the resume now.
    await expect
      .poll(async () => JSON.stringify(((await resumes(page.request, await session(page)).get(r.resumeId)) as { content?: unknown }).content ?? ""), { timeout: 30_000 })
      .toMatch(/40 store managers/);
    // Contact details already on the resume stay (the pasted text had none).
    const saved = (await resumes(page.request, await session(page)).get(r.resumeId)) as { content?: { personalInfo?: { email?: string; phone?: string } } };
    expect(saved.content?.personalInfo?.email).toBe("priya.test@northwind.invalid");
    expect(saved.content?.personalInfo?.phone).toBe("+91 98201 11111");
  } finally {
    await resumes(page.request, await session(page)).remove(r.resumeId);
  }
});
