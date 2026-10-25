// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/fonts/hackathon-reel", () => ({ hackathonReelFontVars: "" }));
vi.mock("next/link", () => ({ default: (props: Record<string, unknown>) => <a {...props} /> }));
import { ResumeScoreDialog } from "../components/ResumeScoreDialog";
import { button, cleanup, render, text } from "@/test-utils/render";

afterEach(cleanup);

const base = {
  open: true,
  onOpenChange: vi.fn(),
  phase: "submitted" as const,
  minScore: 60,
  target: 75,
  challengeNumber: 1,
  editHref: null,
  errorMessage: null,
  onSubmit: vi.fn(),
  onComplete: vi.fn(),
};

describe("ResumeScoreDialog after submit", () => {
  it("score still being worked out: says so and holds Complete Challenge", () => {
    render(<ResumeScoreDialog {...base} score={null} scoring />);
    expect(text()).toMatch(/Checking your ATS score/);
    expect(text()).not.toMatch(/couldn.t calculate/);
    expect((button(/Complete Challenge 1/) as HTMLButtonElement).disabled).toBe(true);
  });

  it("score arrived: shows it and lets them complete", () => {
    render(<ResumeScoreDialog {...base} score={72} />);
    expect(text()).not.toMatch(/Checking your ATS score/);
    expect((button(/Complete Challenge 1/) as HTMLButtonElement).disabled).toBe(false);
  });
});
