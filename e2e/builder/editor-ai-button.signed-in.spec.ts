import { expect, test, type Page, type TestInfo } from "@playwright/test";
import path from "node:path";
import { dismissPopups, resumes, session, type TestResume } from "../fixtures/api";

/**
 * The "AI" button on the canvas: select words in a bullet, press AI, and the AI Coach opens
 * with that text and asks for options straight away. @real-ai: the rewrite goes through the
 * QA backend to the real model, so the wording of the options is not checked, only that one
 * goes back into the bullet in place of the selected words.
 */
const BULLET = "Led 12 product launches, growing qualified leads by 38% in a year.";
const SPAN = "growing qualified leads";

/** Puts the caret in the bullet and selects `SPAN` in it, as a user would by dragging. */
async function selectSpan(page: Page) {
  const bullet = page.locator(".resume-page [data-rx-rich] li", { hasText: SPAN }).filter({ visible: true }).first();
  await expect(bullet).toBeVisible({ timeout: 30_000 });
  await bullet.click();
  await page.evaluate((span) => {
    const li = Array.from(document.querySelectorAll<HTMLElement>(".resume-page [data-rx-rich] li")).find(
      (el) => el.getClientRects().length > 0 && el.textContent?.includes(span),
    );
    if (!li) throw new Error("bullet not found");
    const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const at = node.textContent?.indexOf(span) ?? -1;
      if (at >= 0) {
        const range = document.createRange();
        range.setStart(node, at);
        range.setEnd(node, at + span.length);
        const sel = window.getSelection()!;
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
    }
    throw new Error("span not found in one text node");
  }, SPAN);
}

/** Proof screenshots: attached to the report, and copied to E2E_SHOT_DIR when it's set. */
async function shot(page: Page, info: TestInfo, name: string) {
  const file = info.outputPath(`${name}.png`);
  await page.screenshot({ path: file });
  await info.attach(name, { path: file, contentType: "image/png" });
  if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, `${name}.png`) });
}

function openTestResume() {
  let created: TestResume | undefined;
  let api: ReturnType<typeof resumes>;
  test.beforeEach(async ({ page, request }) => {
    api = resumes(request, await session(page));
    created = await api.create(`E2E AI button ${Date.now()}`);
    await page.goto(`/dashboard/resumes/${created.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);
  });
  test.afterEach(async () => {
    if (created) await api.remove(created.resumeId);
  });
}

test.describe("editor AI button", () => {
  openTestResume();

  test("AI on selected words rewrites only them @real-ai", async ({ page }, info) => {
    test.setTimeout(180_000);
    const toolbar = page.getByRole("toolbar", { name: "Text style" });
    const ai = toolbar.getByRole("button", { name: "Reword with AI" });
    const coach = page.getByRole("heading", { name: "AI Coach", exact: true });
    let shotTaken = false;
    // The trial offer pops up on a timer and takes the focus (and the selection) with it:
    // select again and retry when it does.
    await expect(async () => {
      await selectSpan(page);
      await expect(ai).toBeVisible({ timeout: 5_000 });
      if (!shotTaken) await shot(page, info, "ai-button-desktop");
      shotTaken = true;
      await ai.click({ timeout: 5_000 });
      // The AI Coach opens on the left with the selected words, and asks without another click.
      await expect(coach).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 60_000 });
    await expect(page.getByText("Selected text", { exact: true })).toBeVisible();
    const target = page.getByTestId("ai-coach-target");
    await expect(target).toContainText(BULLET);
    await expect(target.locator("mark")).toHaveText(SPAN);

    const option = page.getByRole("button", { name: /use & edit/i }).first();
    await expect(option).toBeVisible({ timeout: 90_000 });
    await option.click();
    const box = page.getByLabel("Edit before it goes in");
    const draft = (await box.inputValue()).replace(/\{[^{}\n]{0,15}\}/g, "40");
    await box.fill(draft);
    await page.getByRole("button", { name: /^put this in$/i }).click();

    // Only the selected words changed: the rest of the bullet is still there.
    const rewritten = page.locator(".resume-page [data-rx-rich] li", { hasText: "Led 12 product launches," }).filter({ visible: true }).first();
    await expect(rewritten).toContainText("by 38% in a year");
    await expect(rewritten).not.toContainText(SPAN);
    await expect(page.getByText("In your resume")).toBeVisible();
    await shot(page, info, "ai-coach-applied-desktop");
  });
});

test.describe("editor AI chip on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  openTestResume();

  test("tapping AI by a bullet opens the AI Coach on that line @real-ai", async ({ page }, info) => {
    test.setTimeout(180_000);
    const bullet = page.locator(".resume-page [data-rx-rich] li", { hasText: SPAN }).filter({ visible: true }).first();
    await expect(bullet).toBeVisible({ timeout: 30_000 });
    await bullet.tap();
    const chip = page.getByRole("button", { name: "Reword with AI" }).filter({ visible: true });
    await expect(chip).toBeVisible();
    await shot(page, info, "ai-chip-phone");
    await chip.tap();
    await expect(page.getByRole("heading", { name: "AI Coach", exact: true })).toBeVisible();
    await expect(page.getByTestId("ai-coach-target")).toContainText(BULLET);
    await expect(page.getByRole("button", { name: /use & edit/i }).first()).toBeVisible({ timeout: 90_000 });
    await shot(page, info, "ai-coach-phone");
  });
});
