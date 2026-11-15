// @vitest-environment jsdom
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ATSGuestResult } from "../ATSGuestResult";
import { cleanup, render } from "@/test-utils/render";
import type { ATSGuestTeaser } from "@/lib/api";
import type { ATSReportV3 } from "@/types/atsReport";

vi.mock("@/components/marketing-2026/fonts", () => ({ geist: { variable: "" }, geistMono: { variable: "" }, caveat: { variable: "" } }));
vi.mock("@/components/PaginatedPreview", () => ({
  PaginatedPreview: ({ resume }: { resume: { content: { name: string } } }) => <div>{resume.content.name}</div>,
}));
vi.mock("../ATSResumeCanvas", () => ({
  ATSResumeCanvas: ({ resume }: { resume?: { content?: { name?: string } } }) => <div data-testid="canvas">marked page: {resume?.content?.name}</div>,
}));
const rewrite = vi.fn();
vi.mock("@/lib/api", async (original) => ({
  ...(await original<object>()),
  resumeApi: { getTemplate: async () => ({ id: "condensed-rule" }) },
  atsGuestApi: { rewrite: (...a: unknown[]) => rewrite(...a) },
}));
vi.mock("@/lib/templateLoader", () => ({ cssRegistry: { loadTemplateCSS: async () => {} } }));
vi.mock("@/lib/applyResumeTemplate", () => ({
  buildResumeTemplateApplication: async (templateId: string) => ({ templateId, sectionOrder: [], layout: {} }),
}));
vi.mock("@/lib/resume-template-availability", () => ({ fetchDisabledResumeTemplateIds: async () => ["meridian"] }));

afterEach(() => {
  cleanup();
  rewrite.mockReset();
  localStorage.clear();
});
window.scrollTo = vi.fn() as never;
Element.prototype.scrollIntoView = vi.fn();
globalThis.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} } as never;

const teaser: ATSGuestTeaser = {
  score: 76,
  issueCount: 9,
  possibleScore: 90,
  categories: [],
  checksToFix: [
    { label: "Repetition", issueCount: 3, impact: "high" },
    { label: "Interview Risks", issueCount: 2, impact: "medium" },
  ],
};

const report = {
  version: 3,
  score: 76,
  issueCount: 5,
  mode: "standalone",
  strengths: [],
  weaknesses: [],
  suggestions: [],
  categories: {
    content: {
      id: "content",
      label: "Content",
      score: 70,
      issueCount: 3,
      checks: [{ id: "repetition", label: "Repetition", description: "Same words", status: "fail", score: 50, issueCount: 3, issues: [{ title: "Repeated word", description: "led, led", excerpt: "Led the team that led the launch" }] }],
    },
    hrRedFlags: {
      id: "hrRedFlags",
      label: "HR Red Flags",
      score: 60,
      issueCount: 2,
      checks: [{ id: "interviewRisks", label: "Interview Risks", description: "Probing questions", status: "fail", score: 46, issueCount: 2, issues: [], locked: true }],
    },
  },
} as unknown as ATSReportV3;

const props = { teaser, report, content: { name: "Nisha", summary: "Led the team that led the launch" }, sectionOrder: [], onCheckAnother: () => {} };
const tab = (label: string) => [...document.querySelectorAll<HTMLElement>("[role=tab]")].find((t) => t.textContent === label)!;
const button = (label: string) => [...document.querySelectorAll<HTMLElement>("button")].find((b) => b.textContent?.includes(label))!;
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const click = (el: HTMLElement) => act(async () => { el.click(); });

describe("ATSGuestResult", () => {
  it("is the report page: scores, the marked resume, and the checks", async () => {
    const view = render(<ATSGuestResult {...props} fileName="cv.pdf" />);
    await settle();
    expect(view.container.textContent).toContain("ATS REPORT");
    expect(view.container.textContent).toContain("cv.pdf");
    expect(view.container.textContent).toContain("marked page: Nisha");
    expect(view.container.textContent).toContain("Repeated word");
    expect(view.container.textContent).toContain("Improve now");
  });

  it("keeps locked checks for sign-up, with only their count showing", async () => {
    const view = render(<ATSGuestResult {...props} />);
    await settle();
    expect(view.container.textContent).toContain("2 more findings are waiting");
    expect(view.container.textContent).not.toContain("Probing questions led");
    await click(button("HR Red Flags"));
    expect(view.container.textContent).toContain("2 locked");
    expect(view.container.textContent).toContain("Sign up free to see them");
  });

  it("shows today's result until the rewrite is ready, then the improved one", async () => {
    let finish!: (v: unknown) => void;
    rewrite.mockReturnValue(new Promise((r) => { finish = r; }));
    const view = render(<ATSGuestResult {...props} token="tok" />);
    await click(tab("After improvement"));
    const text = () => view.container.textContent ?? "";
    expect(text()).toContain("ESTIMATING…");
    expect(text()).toContain("Your score today76");
    expect(text()).toContain("Rewriting your resume with the fixes");
    expect(text()).not.toContain("FIXED");

    await act(async () => { finish({ content: { name: "Nisha, rewritten" }, sectionOrder: [] }); await new Promise((r) => setTimeout(r, 0)); });
    await settle();
    // A locked check is still to do, so the estimate is for when they finish.
    expect(text()).toContain("WHEN YOU FINISH");
    expect(text()).toContain("The AI rewrite fixed 1");
    expect(text()).toContain("Your score could reach80+");
    expect(text()).toContain("Nisha, rewritten");
    // Only the line the rewrite changed counts as fixed; the locked check stays locked.
    expect(text()).toContain("1 fixed by the rewrite");
    expect(text()).toContain("FIXED");
    expect(text()).toContain("SIGN UP TO SEE");
    expect(rewrite).toHaveBeenCalledTimes(1);
  });

  it("falls back to their own wording if the rewrite fails", async () => {
    rewrite.mockRejectedValue(new Error("down"));
    const view = render(<ATSGuestResult {...props} token="tok" />);
    await settle();
    await click(tab("After improvement"));
    await settle();
    expect(view.container.textContent).toContain("Wording fixes happen in the editor");
    expect(view.container.textContent).toContain("Nisha");
  });

  it("offers enabled templates to try on, and remembers the pick for after sign-up", async () => {
    rewrite.mockResolvedValue({ content: { name: "Nisha" }, sectionOrder: [] });
    const view = render(<ATSGuestResult {...props} token="tok" />);
    await settle();
    await click(tab("After improvement"));
    await settle();
    const group = view.container.querySelector("[aria-label='Try a template']")!;
    expect(group.textContent).toContain("Harvard");
    expect(group.textContent).not.toContain("Meridian");
    await click([...group.querySelectorAll("button")].find((b) => b.textContent === "Harvard") as HTMLElement);
    expect(localStorage.getItem("ats-checker-guest-template")).toBe("harvard");
  });
});
