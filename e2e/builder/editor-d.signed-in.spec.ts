import { expect, test } from "@playwright/test";
import path from "node:path";
import { dismissPopups, fictionalContent, resumes, session, type TestResume } from "../fixtures/api";

/** ⌘K quick actions, cover letter from the resume, peer-skills checklist. @real-ai */
test("Cmd+K → cover letter from the resume; Cmd+K → section AI; peer-skills checklist @real-ai", async ({ page }) => {
  test.setTimeout(300_000);
  const api = resumes(page.request, await session(page));
  const r: TestResume = await api.create(`E2E editor D ${Date.now()}`, fictionalContent());
  try {
    await api.rescore(r.resumeId);
    await page.goto(`/dashboard/resumes/${r.resumeId}/edit`);
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });
    await dismissPopups(page);
    await page.waitForTimeout(2500);
    for (let i = 0; i < 3 && (await page.getByRole("dialog", { name: "Editor tour" }).count()); i++) await page.keyboard.press("Escape");

    // ⌘K → "cover" → Enter
    await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
    const palette = page.getByTestId("command-palette");
    await expect(palette).toBeVisible();
    await page.keyboard.type("cover", { delay: 80 });
    await page.waitForTimeout(600);
    await page.keyboard.press("Enter");
    const cl = page.getByTestId("cover-letter");
    await expect(cl).toBeVisible();
    await cl.getByLabel("Company").fill("Contoso Retail");
    await cl.getByRole("button", { name: "Write my cover letter" }).click();
    const text = cl.getByTestId("cover-letter-text");
    await expect(text).toBeVisible({ timeout: 90_000 });
    const letter = await text.inputValue();
    console.log(letter);
    expect(letter).toMatch(/Dear Contoso Retail hiring team/);
    expect(letter).toMatch(/12|38%|launch/i);
    await page.waitForTimeout(2000);
    await page.keyboard.press("Escape");

    // ⌘K → rewrite summary
    await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
    await page.keyboard.type("summary", { delay: 80 });
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("section-ai")).toBeVisible();
    await expect(page.getByTestId("section-ai").getByRole("button", { name: /Shorter: 2 lines/ })).toBeVisible();
    await page.waitForTimeout(1500);
    await page.keyboard.press("Escape");

    // Peer skills: tick one, add it.
    const peer = page.getByTestId("peer-skills");
    if (await peer.count()) {
      const first = peer.getByRole("button").first();
      const skill = (await first.textContent())?.trim() ?? "";
      await first.click();
      await page.getByRole("button", { name: "Add the ones I ticked" }).click();
      await expect
        .poll(async () => JSON.stringify(((await resumes(page.request, await session(page)).get(r.resumeId)) as { content?: { skills?: unknown } }).content?.skills ?? ""), { timeout: 30_000 })
        .toContain(skill);
    } else {
      console.log("no peer-skills gaps on this run");
    }
    if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, "editor-d.png") });
  } finally {
    await resumes(page.request, await session(page)).remove(r.resumeId);
  }
});
