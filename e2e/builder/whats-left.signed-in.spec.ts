import { expect, test, type Page, type TestInfo } from "@playwright/test";
import path from "node:path";
import { dismissPopups, fictionalContent, resumes, session, type TestResume } from "../fixtures/api";

/**
 * After an AI build the editor shows "What's left for you": only what the user knows. The resume
 * here is made through the API with the build notes Resume Writer v2 saves (aiBuildMeta), so no
 * AI build runs; the first-open ATS check does (@real-ai).
 */
const SLOT_LINE = "Grew qualified leads by [X%] in a year by running 12 product launches across search and social.";
const EVIDENCE_LINE = "Managed a ₹1.2 Cr annual budget across search, social and events.";
const SUGGESTION = "Wrote the launch playbook the sales team now uses for every new product.";

async function shot(page: Page, info: TestInfo, name: string) {
  const file = info.outputPath(`${name}.png`);
  await page.screenshot({ path: file });
  await info.attach(name, { path: file, contentType: "image/png" });
  if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, `${name}.png`) });
}

test.describe("what's left for you", () => {
  let created: TestResume | undefined;
  let api: ReturnType<typeof resumes>;

  test.beforeEach(async ({ page, request }) => {
    api = resumes(request, await session(page));
    const content = fictionalContent();
    content.experience[0].description = `<ul><li>${SLOT_LINE}</li><li>${EVIDENCE_LINE}</li></ul>`;
    created = await api.create(`E2E whats left ${Date.now()}`, content);
    await api.update(created.resumeId, {
      aiBuildMeta: {
        slots: [{ path: "experience.0.description.0", text: SLOT_LINE }],
        evidence: [{ path: "experience.0.description.1", text: EVIDENCE_LINE, sources: ["Owned the yearly marketing budget (Rs 1.2 Cr)"] }],
        suggestions: [{ roleIndex: 0, role: "Marketing Manager (Northwind Labs)", text: SUGGESTION }],
        skillsToConfirm: ["Salesforce"],
        dismissed: [],
      },
    });
    await page.goto(`/dashboard/resumes/${created.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);
  });
  test.afterEach(async ({ page }) => {
    if (created) await resumes(page.request, await session(page)).remove(created.resumeId);
  });

  test("fill a number, confirm a skill, add a line; it stays done after reload @real-ai", async ({ page }, info) => {
    test.setTimeout(180_000);
    const card = page.getByTestId("whats-left");
    await expect(card).toBeVisible();
    await expect(card.getByText("Add your LinkedIn profile")).toBeVisible();
    await shot(page, info, "whats-left-card");

    // Fill the slot: the bullet on the page now has the real number.
    await card.getByLabel("Your number").fill("35%");
    await card.getByRole("button", { name: "Fill" }).click();
    await expect(page.locator(".resume-page li", { hasText: "Grew qualified leads by 35% in a year" }).filter({ visible: true }).first()).toBeVisible();
    await expect(card.getByLabel("Your number")).toHaveCount(0);

    await card.getByRole("button", { name: "Yes, add" }).click();
    await expect(page.locator(".resume-page", { hasText: "Salesforce" }).filter({ visible: true }).first()).toBeVisible();

    await card.getByRole("button", { name: "Add if true" }).click();
    await expect(page.locator(".resume-page li", { hasText: SUGGESTION }).filter({ visible: true }).first()).toBeVisible();

    // Dismiss the rest of the contact prompts? Keep one, dismiss one.
    const before = await card.locator("li").count();
    await card.getByRole("button", { name: "Dismiss" }).first().click();
    await expect(card.locator("li")).toHaveCount(before - 1);
    await shot(page, info, "whats-left-after");

    // Two bullets stay two bullets.
    await expect(page.locator(".resume-page li", { hasText: "annual budget" }).filter({ visible: true }).first()).not.toContainText("Grew qualified");

    // The first-open ATS check ran on its own. (A fresh token each time: Clerk's expire in a minute.)
    const fresh = async () => resumes(page.request, await session(page));
    await expect.poll(async () => (await (await fresh()).get(created!.resumeId)).atsScore, { timeout: 120_000 }).toBeGreaterThan(0);

    // The ATS panel splits the score into plain parts.
    await page.getByRole("button", { name: "ATS score" }).first().click();
    await expect(page.getByTestId("score-breakdown")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("score-breakdown")).toContainText("Readable by ATS");
    await shot(page, info, "score-breakdown");

    // Saved: after a reload the done items stay done.
    await expect.poll(async () => {
      const r = (await (await fresh()).get(created!.resumeId)) as TestResume & { aiBuildMeta?: { dismissed?: string[] } };
      return r.aiBuildMeta?.dismissed?.length ?? 0;
    }, { timeout: 30_000 }).toBeGreaterThanOrEqual(3);
    await page.reload();
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("button", { name: "Add if true" })).toHaveCount(0);
    await expect(page.getByLabel("Your number")).toHaveCount(0);
  });

  test("the AI Coach shows what an AI line is based on, and practice questions @real-ai", async ({ page }, info) => {
    test.setTimeout(120_000);
    const bullet = page.locator(".resume-page [data-rx-rich] li", { hasText: "annual budget" }).filter({ visible: true }).first();
    await bullet.click();
    await page.getByRole("toolbar", { name: "Text style" }).getByRole("button", { name: "Reword with AI" }).click();
    const basedOn = page.getByTestId("ai-coach-based-on");
    await expect(basedOn).toBeVisible({ timeout: 20_000 });
    await basedOn.locator("summary").click();
    await expect(basedOn.getByText("Owned the yearly marketing budget")).toBeVisible();
    await shot(page, info, "ai-coach-based-on");

    // "Practice defending this line" (@real-ai): three interview follow-ups for the line.
    await page.getByRole("button", { name: "Practice defending this line" }).click();
    const defend = page.getByTestId("ai-coach-defend");
    await expect(defend.locator("li")).toHaveCount(3, { timeout: 60_000 });
    await expect(defend).toContainText("A strong answer shows");
    await shot(page, info, "ai-coach-defend");
  });
});
