import { expect, test, type Page } from "@playwright/test";
import { dismissPopups } from "../fixtures/api";

test.beforeEach(async ({ page }) => {
  await dismissPopups(page);
});

/** Old resume first, then the design closest to it is preselected and shown first. */
async function uploadAndOpenDesigns(page: Page, file: string) {
  await page.goto("/dashboard/resumes/new");
  await expect(page.getByRole("heading", { name: /bring in what you already have/i })).toBeVisible({ timeout: 30_000 });
  await page.locator('input[type="file"]').setInputFiles(file);
  const next = page.getByRole("button", { name: /^continue$/i });
  await expect(next).toBeEnabled({ timeout: 30_000 });
  // the reading panel says what it found, and the closest design by name
  await expect(page.getByLabel("Found so far").getByText("Experience")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/closest design:/i)).toBeVisible({ timeout: 15_000 });
  await next.click();
  await page.getByRole("button", { name: /skip and continue/i }).click();
  await expect(page.getByRole("heading", { name: /closest to your resume/i })).toBeVisible({ timeout: 30_000 });
}

test("a dark-sidebar resume gets the dark-sidebar design first, selected", async ({ page }) => {
  await uploadAndOpenDesigns(page, "e2e/fixtures/files/design-dark-sidebar.pdf");
  const badge = page.getByTestId("closest-design");
  await expect(badge).toHaveCount(1);
  const firstCard = page.locator('[role="button"][aria-pressed]').first();
  await expect(firstCard).toContainText(/atlantic blue/i);
  await expect(firstCard).toHaveAttribute("aria-pressed", "true");
  await expect(firstCard.getByTestId("closest-design")).toBeVisible();
  // every other design is still offered
  expect(await page.locator('[role="button"][aria-pressed]').count()).toBeGreaterThan(8);
});

test("a plain serif one-column resume gets a classic serif design first", async ({ page }) => {
  await uploadAndOpenDesigns(page, "e2e/fixtures/files/design-plain-serif.pdf");
  const firstCard = page.locator('[role="button"][aria-pressed]').first();
  await expect(firstCard).toContainText(/classic|corporate|executive|harvard/i);
  await expect(firstCard).toHaveAttribute("aria-pressed", "true");
});

test("sample content (no old resume) keeps the usual order, nothing preselected as closest", async ({ page }) => {
  await page.goto("/dashboard/resumes/new");
  await expect(page.getByRole("heading", { name: /bring in what you already have/i })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /skip, start with sample content/i }).click();
  await expect(page.getByRole("heading", { name: /pick a design you like/i })).toBeVisible();
  await expect(page.getByTestId("closest-design")).toHaveCount(0);
});
