import { expect, test } from "@playwright/test";
import path from "node:path";
import { dismissPopups } from "../fixtures/api";

/**
 * New resume → "Build it with AI" → chat or voice: the panel opens (it was a blank page when
 * details came before the design step and no template was picked yet).
 */
for (const mode of ["Type in chat", "Talk with voice AI"] as const) {
  test(`new resume: "${mode}" opens the AI panel, never a blank page`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/dashboard/resumes/new");
    await dismissPopups(page);
    await page.getByRole("button", { name: /Build it with AI/ }).click({ timeout: 45_000 });
    await page.getByRole("button", { name: new RegExp(mode) }).click();
    if (mode === "Type in chat") {
      await expect(page.getByPlaceholder("Type your message…")).toBeVisible({ timeout: 45_000 });
      // The assistant's first message arrives (the session started), or a readable error with Try again.
      // Either the chat started or it shows why it didn't (with Try again) — never an empty area.
      await expect(page.getByRole("button", { name: "Try again" }).or(page.locator('[class*="rounded-tl-sm"]')).first()).toBeVisible({ timeout: 45_000 });
    } else {
      await expect(page.getByText(/Talk with Ava to build your resume|voice assistant/i).first()).toBeVisible({ timeout: 45_000 });
    }
    if (process.env.E2E_SHOT_DIR) await page.screenshot({ path: path.join(process.env.E2E_SHOT_DIR, `chat-opens-${mode.split(" ")[0].toLowerCase()}.png`) });
  });
}
