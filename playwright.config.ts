import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Local test-user login (git-ignored .env.e2e), used only by e2e/auth.setup.ts.
const envFile = path.join(__dirname, ".env.e2e");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

/**
 * End-to-end tests for the Resume Builder and ATS Checker (see
 * docs/resume-builder-ats/PLAYWRIGHT_TEST_STRATEGY.md).
 *
 * Runs against the local app (fe :3001, backend :5004 on the QA database, launch config
 * "interview-core-qa-db"). It refuses any other host unless E2E_ALLOW_REMOTE names a
 * stage environment, so it can never run against production.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3001";
const host = new URL(baseURL).hostname;
const allowedRemote = (process.env.E2E_ALLOW_REMOTE ?? "").split(",").map((h) => h.trim()).filter(Boolean);
if (!["localhost", "127.0.0.1"].includes(host) && !allowedRemote.includes(host)) {
  throw new Error(`E2E tests only run against localhost or an allowed stage host, not ${host}`);
}
if (/(^|\.)interviewtrix\.com$/.test(host) && !/stage|staging|dev|qa/.test(host)) {
  throw new Error("E2E tests must never run against production");
}

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "setup-auth", testMatch: /auth\.setup\.ts/ },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/auth\.setup\.ts/, /\.signed-in\.spec\.ts/],
    },
    {
      // Signed in as the dummy test user (QA database). Runs the setup first.
      name: "signed-in",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
      testMatch: /\.signed-in\.spec\.ts/,
      dependencies: ["setup-auth"],
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testIgnore: [/auth\.setup\.ts/, /\.signed-in\.spec\.ts/],
      grep: /@mobile/,
    },
  ],
});
