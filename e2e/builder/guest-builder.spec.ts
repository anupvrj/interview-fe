import { expect, test } from "@playwright/test";

/** The public builder, signed out: nothing is sent to the server until sign-up. */
test.describe("guest resume builder", () => {
  test("start from scratch → preview → switch design → refresh keeps it → sign-up carries the draft", async ({ page }) => {
    await page.goto("/resume-builder/start");
    await page.getByRole("button", { name: /start from scratch/i }).click();
    await page.getByLabel(/full name/i).fill("Riya Test");
    await page.getByLabel(/job title you want/i).fill("Marketing Manager");
    await page.getByRole("button", { name: /see my resume/i }).click();

    await expect(page.getByRole("heading", { name: /your resume is started/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Riya Test").filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });

    const designs = page.getByRole("listbox", { name: /resume designs/i }).getByRole("option");
    await expect(designs.first()).toBeVisible();
    await designs.nth(1).click();
    await expect(designs.nth(1)).toHaveAttribute("aria-selected", "true");

    await page.reload();
    await expect(page.getByRole("heading", { name: /your resume is started/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("listbox", { name: /resume designs/i }).getByRole("option").nth(1)).toHaveAttribute("aria-selected", "true");

    const save = page.getByRole("link", { name: /save and keep editing, free/i });
    await expect(save).toHaveAttribute("href", /\/sign-up\?redirect_url=%2Fdashboard%2Fresumes%2Fnew%3Fdraft%3Dguest/);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ix-guest-resume-draft") ?? "null"));
    expect(stored?.data?.content?.personalInfo?.fullName).toBe("Riya Test");
  });

  test("name is required; a non-PDF is refused with a message", async ({ page }) => {
    await page.goto("/resume-builder/start");
    await page.getByLabel(/upload your resume \(pdf\)/i).setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: Buffer.from("not a pdf") });
    await expect(page.getByRole("alert").filter({ hasText: /choose a PDF/i })).toBeVisible();
    await page.getByRole("button", { name: /start from scratch/i }).click();
    await page.getByRole("button", { name: /see my resume/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /add your name/i })).toBeVisible();
  });

  test("'Build my resume, free' on the builder page opens the public builder", async ({ page }) => {
    await page.goto("/ai-resume-builder");
    await page.waitForFunction(() => Boolean((window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded), null, { timeout: 30_000 });
    const cta = page.getByRole("link", { name: /build my resume, free/i }).first();
    await expect(cta).toHaveAttribute("href", "/resume-builder/start");
  });
});

test.describe("guest resume builder from a PDF @real-ai", () => {
  test("uploads a fictional resume and shows it in a template", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/resume-builder/start");
    await page.getByLabel(/upload your resume \(pdf\)/i).setInputFiles("e2e/fixtures/files/marketing-manager.pdf");
    await expect(page.getByText(/reading your resume/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /your resume, in a clean design/i })).toBeVisible({ timeout: 150_000 });
    const name = await page.getByLabel(/^full name$/i).inputValue();
    expect(name.length).toBeGreaterThan(2);
    await expect(page.getByText(name).filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });
  });
});
