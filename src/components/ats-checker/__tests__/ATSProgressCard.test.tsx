// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@/test-utils/render";
import { ATSProgressCard } from "../ATSProgressCard";

vi.mock("@/components/marketing-2026/fonts", () => ({ geist: { variable: "" }, geistMono: { variable: "" }, caveat: { variable: "" } }));
afterEach(cleanup);

const h = (score: number, at: string, status: string) => ({
  _id: at, score, issueCount: 0, categories: {}, source: "full" as const, createdAt: at,
  checks: [{ id: "repetition", category: "content", status, score: 50, issueCount: status === "pass" ? 0 : 2 }],
});

describe("ATSProgressCard", () => {
  it("shows the gain and what was fixed, with the trend described for screen readers", () => {
    const view = render(<ATSProgressCard history={[h(70, "2026-11-02", "pass"), h(55, "2026-11-01", "fail")]} labels={{ repetition: "Repetition" }} />);
    const text = view.container.textContent ?? "";
    expect(text).toContain("Up 15 points since your first check");
    expect(text).toContain("Repetition fixed");
    expect(view.container.querySelector("svg[role=img]")?.getAttribute("aria-label")).toContain("55, 70");
  });

  it("stays hidden with a single check", () => {
    const view = render(<ATSProgressCard history={[h(55, "2026-11-01", "fail")]} labels={{}} />);
    expect(view.container.textContent).toBe("");
  });
});
