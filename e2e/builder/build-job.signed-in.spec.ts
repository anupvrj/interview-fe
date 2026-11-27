import { expect, test } from "@playwright/test";
import { API_URL, dismissPopups, resumes, session } from "../fixtures/api";

/**
 * The AI build runs as a server-side job: a page that was closed mid-build picks the job up
 * again and finishes it into the editor. @real-ai: the build goes to the real model (QA backend).
 */
const RESUME_TEXT = `Kabir Test
kabir.test@northwind.invalid | +91 98111 22334 | Hyderabad, India

EXPERIENCE
Data Analyst, Northwind Foods (Jun 2021 - Present)
- Built weekly sales dashboards in Power BI for 40 store managers
- Wrote SQL reports on stock levels and supplier delays
- Automated the monthly demand forecast in Python, cutting prep from 3 days to 1

EDUCATION
B.Tech, Computer Science, JNTU Hyderabad, 2017 - 2021

SKILLS
SQL, Python, Power BI, Excel`;

test("a reopened page finishes a build that was already running @real-ai", async ({ page }) => {
  test.setTimeout(300_000);
  const s = await session(page);
  const started = await page.request.post(`${API_URL}/resume-build-jobs`, {
    headers: { Authorization: `Bearer ${s.token}` },
    data: { templateId: "condensed-rule", resumeText: RESUME_TEXT, enhance: true },
  });
  expect(started.status()).toBe(202);
  const { jobId } = ((await started.json()) as { data: { jobId: string } }).data;
  expect(jobId).toMatch(/^rbj_/);

  // As if the tab that started it had closed: only the saved job id is left.
  await page.evaluate(
    (job) => localStorage.setItem("it:resume-build-job", JSON.stringify(job)),
    { jobId, templateId: "condensed-rule", jdText: "", source: "pdf", at: Date.now() },
  );
  await page.goto("/dashboard/resumes/new");
  await dismissPopups(page);
  await page.waitForURL(/\/dashboard\/resumes\/[^/]+\/edit/, { timeout: 240_000 });
  await expect(page.getByText("Kabir Test").filter({ visible: true }).first()).toBeVisible({ timeout: 45_000 });

  const resumeId = page.url().split("/dashboard/resumes/")[1].split("/")[0];
  expect(await page.evaluate(() => localStorage.getItem("it:resume-build-job"))).toBeNull();
  // Someone else's session can't read the job; the owner can.
  const fresh = await session(page);
  const own = await page.request.get(`${API_URL}/resume-build-jobs/${jobId}`, { headers: { Authorization: `Bearer ${fresh.token}` } });
  expect(((await own.json()) as { data: { status: string } }).data.status).toBe("done");
  await resumes(page.request, fresh).remove(resumeId);
});
