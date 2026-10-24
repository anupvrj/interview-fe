// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { HackathonResumeStartChoices } from "../HackathonResumeStartChoices";
import { button, cleanup, click, render, text } from "@/test-utils/render";

afterEach(cleanup);

function choices(props: Partial<Parameters<typeof HackathonResumeStartChoices>[0]> = {}) {
  const h = { onUseUploadedCv: vi.fn(), onUploadPdf: vi.fn(), onTalkToAi: vi.fn(), onLinkedIn: vi.fn(), onUseSample: vi.fn() };
  render(<HackathonResumeStartChoices templateName="True Blue" uploadedCvName={null} loadingUploadedCv={false} busy={false} {...h} {...props} />);
  return h;
}

describe("HackathonResumeStartChoices", () => {
  it("names the picked design and offers real-data starts first, sample last", () => {
    const h = choices();
    expect(text()).toContain("Design: True Blue — you can change it later.");
    expect(text()).not.toContain("Use the CV you uploaded");
    click(button("Upload your resume"));
    click(button("No resume handy? Talk to AI"));
    click(button("Import from LinkedIn"));
    click(button("Start from a sample instead"));
    expect(h.onUploadPdf).toHaveBeenCalled();
    expect(h.onTalkToAi).toHaveBeenCalled();
    expect(h.onLinkedIn).toHaveBeenCalled();
    expect(h.onUseSample).toHaveBeenCalled();
  });

  it("offers the CV from their profile when there is one", () => {
    const h = choices({ uploadedCvName: "priya-cv.pdf" });
    expect(text()).toContain("priya-cv.pdf");
    click(button("Use the CV you uploaded"));
    expect(h.onUseUploadedCv).toHaveBeenCalled();
  });

  it("everything is disabled while a resume is being built", () => {
    choices({ busy: true });
    expect((button("Upload your resume") as HTMLButtonElement).disabled).toBe(true);
    expect((button("Start from a sample instead") as HTMLButtonElement).disabled).toBe(true);
  });

  it("already submitted: shows it as submitted with edit & resubmit, other resumes in a list, new options below", () => {
    const onOpenResume = vi.fn();
    choices({
      onOpenResume,
      submitted: { resumeId: "r1", title: "My Resume", atsScore: 85, submittedAt: new Date().toISOString() },
      resumes: [
        { resumeId: "r1", title: "My Resume", atsScore: 85 },
        { resumeId: "r2", title: "Backend CV", atsScore: 72 },
      ],
    });
    expect(text()).toContain("Your hackathon resume");
    expect(text()).toContain("Submitted");
    expect(text()).toContain("ATS 85");
    click(button("Edit & resubmit"));
    expect(onOpenResume).toHaveBeenCalledWith("r1");
    // the submitted one is listed once: only the other resume is in the picker
    const options = Array.from(document.querySelectorAll("#hk-resume-pick option")).map((o) => o.textContent);
    expect(options).toEqual(["Backend CV · ATS 72"]);
    click(button("Open"));
    expect(onOpenResume).toHaveBeenLastCalledWith("r2");
    expect(text()).toContain("Or start a new one");
    expect(button("Upload your resume")).toBeTruthy();
  });

  it("resumes but nothing submitted yet: pick one to continue", () => {
    const onOpenResume = vi.fn();
    choices({ onOpenResume, resumes: [{ resumeId: "r9", title: "Draft", atsScore: null }] });
    expect(text()).not.toContain("Submitted");
    expect(text()).toContain("Continue with a resume");
    click(button("Open"));
    expect(onOpenResume).toHaveBeenCalledWith("r9");
  });
});
