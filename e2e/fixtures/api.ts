import type { APIRequestContext, Page } from "@playwright/test";

/**
 * Backend helpers for the signed-in suites. They act as the signed-in test user (the
 * dummy user in .env.e2e, QA database only), using the same Clerk session token the app
 * sends. Every resume a test creates is fictional and is deleted afterwards.
 */
export const API_URL = process.env.E2E_API_URL ?? "http://localhost:5004/api";

type Session = { token: string; userId: string };

/** Token and Clerk user id of the signed-in browser session. The page must be on the app. */
export async function session(page: Page): Promise<Session> {
  if (!page.url().startsWith("http")) await page.goto("/dashboard/resumes");
  await page.waitForFunction(() => Boolean((window as unknown as { Clerk?: { session?: unknown } }).Clerk?.session), null, { timeout: 30_000 });
  return page.evaluate(async () => {
    const clerk = (window as unknown as { Clerk: { session: { getToken: () => Promise<string> }; user: { id: string } } }).Clerk;
    return { token: await clerk.session.getToken(), userId: clerk.user.id };
  });
}

async function call<T>(request: APIRequestContext, s: Session, method: "get" | "post" | "put" | "delete", path: string, data?: unknown): Promise<T> {
  const res = await request[method](`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${s.token}` },
    data,
    timeout: 180_000,
  });
  if (!res.ok()) throw new Error(`${method.toUpperCase()} ${path} → ${res.status()} ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json().catch(() => ({}))) as { data?: T };
  return body.data as T;
}

/** A fictional resume (no real person's details). */
export function fictionalContent(summary = "Marketing manager with 6 years of experience running B2B campaigns.") {
  return {
    personalInfo: {
      fullName: "Riya Test",
      // In this app the header's job title is stored in `portfolio`.
      portfolio: "Marketing Manager",
      // Fictional, but not the sample patterns the ATS check caps (example.com, 90000 00000);
      // ".invalid" is a reserved domain that can never receive mail.
      email: "riya.test@northwind.invalid",
      phone: "+91 98201 47356",
      location: "Pune, India",
    },
    profileSummary: `<p>${summary}</p>`,
    experience: [
      {
        id: "exp-1",
        company: "Northwind Labs",
        position: "Marketing Manager",
        startDate: "Jan 2021",
        current: true,
        description:
          "<ul><li>Led 12 product launches, growing qualified leads by 38% in a year.</li><li>Managed a ₹1.2 Cr annual budget across search, social and events.</li></ul>",
      },
    ],
    education: [{ id: "edu-1", institution: "Pune University", degree: "MBA", field: "Marketing", startDate: "2017", endDate: "2019" }],
    skills: ["Campaign strategy", "Google Ads", "HubSpot", "SEO", "Analytics"],
  };
}

export type TestResume = { resumeId: string; atsScore?: number; content?: Record<string, unknown> };

export function resumes(request: APIRequestContext, s: Session) {
  return {
    create: (title: string, content = fictionalContent()) =>
      call<TestResume>(request, s, "post", `/users/${s.userId}/resumes`, { title, templateId: "condensed-rule", content }),
    update: (resumeId: string, data: Record<string, unknown>) => call<TestResume>(request, s, "put", `/resumes/${resumeId}`, data),
    rescore: (resumeId: string, jobDescription?: string) =>
      call<TestResume>(request, s, "post", `/resumes/${resumeId}/ats-score`, jobDescription ? { jobDescription } : {}),
    history: (resumeId: string) => call<{ score: number }[]>(request, s, "get", `/resumes/${resumeId}/ats-history`),
    remove: (resumeId: string) => call<unknown>(request, s, "delete", `/resumes/${resumeId}`).catch(() => undefined),
  };
}
