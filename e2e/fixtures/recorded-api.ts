import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

/**
 * Replays recorded backend responses for AI-backed endpoints, so tests are fast, free and
 * repeatable. Record (or refresh) them against the local backend on the QA database with
 * E2E_RECORD=1: that run makes real AI calls once and saves them to e2e/fixtures/har/.
 *
 * Replay matches on method + path only, serving recorded answers in order: request bodies
 * carry fresh random ids every run (resume entry ids), so an exact-body match never hits.
 */
export const RECORD = process.env.E2E_RECORD === "1";

type HarEntry = {
  request: { method: string; url: string };
  response: { status: number; headers: { name: string; value: string }[]; content: { text?: string; mimeType?: string; encoding?: string } };
};

export async function replayApi(page: Page, name: string, urlPattern: RegExp): Promise<void> {
  const harPath = path.join(__dirname, "har", `${name}.har`);
  if (RECORD) {
    await page.routeFromHAR(harPath, { url: urlPattern, update: true, updateContent: "embed" });
    return;
  }
  const entries: HarEntry[] = JSON.parse(fs.readFileSync(harPath, "utf8")).log.entries;
  const queues = new Map<string, HarEntry[]>();
  for (const e of entries) {
    const key = `${e.request.method} ${new URL(e.request.url).pathname}`;
    queues.set(key, [...(queues.get(key) ?? []), e]);
  }
  const served = new Map<string, number>();
  await page.route(urlPattern, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: corsHeaders() });
    const key = `${req.method()} ${new URL(req.url()).pathname}`;
    const queue = queues.get(key);
    if (!queue?.length) return route.abort("failed");
    const n = served.get(key) ?? 0;
    served.set(key, n + 1);
    const e = queue[Math.min(n, queue.length - 1)]; // repeat the last answer if asked again
    const body = e.response.content.encoding === "base64" ? Buffer.from(e.response.content.text ?? "", "base64") : e.response.content.text ?? "";
    await route.fulfill({
      status: e.response.status,
      headers: { ...corsHeaders(), "content-type": e.response.content.mimeType ?? "application/json" },
      body,
    });
  });
}

function corsHeaders(): Record<string, string> {
  return {
    "access-control-allow-origin": "http://localhost:3001",
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  };
}

/** The signed-out ATS check's endpoints (lookup, extract, score, rewrite, prepare). */
export const ATS_PREVIEW_API = /\/api\/ats-preview(\/|\?|$)/;

export const files = {
  marketingManager: path.join(__dirname, "files", "marketing-manager.pdf"),
  student: path.join(__dirname, "files", "btech-student.pdf"),
};
