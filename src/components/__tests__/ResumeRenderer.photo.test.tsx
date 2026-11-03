// @vitest-environment jsdom
import { act } from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { ResumeRenderer } from "../ResumeRenderer";
import { TemplateLoader } from "@/lib/templateLoader";
import { cleanup, render } from "@/test-utils/render";
import type { Resume, ResumeTemplate } from "@/lib/api";

afterEach(cleanup);
beforeAll(() => TemplateLoader.loadCodeTemplate("atlantic-blue"));

// `previewOverrides: null` renders the template's own code config (no network).
const template = { id: "atlantic-blue", name: "Atlantic Blue", previewOverrides: null } as unknown as ResumeTemplate;
const resume = (profilePicture: string) =>
  ({
    resumeId: "res_1",
    userId: "user_1",
    title: "Mine",
    templateId: "atlantic-blue",
    content: { personalInfo: { fullName: "Anup Kumar", email: "a@b.co", profilePicture } },
  }) as unknown as Resume;

const photo = () => document.querySelector<HTMLImageElement>("img[alt='Profile']");

describe("ResumeRenderer photo", () => {
  it("shows the photo while its link loads", () => {
    render(<ResumeRenderer resume={resume("https://cdn.example/me.jpg")} template={template} />);
    expect(photo()?.getAttribute("src")).toBe("https://cdn.example/me.jpg");
  });

  it("drops a photo whose link no longer loads instead of showing a broken image", () => {
    const view = render(<ResumeRenderer resume={resume("https://cdn.example/expired.jpg")} template={template} />);
    act(() => {
      photo()!.dispatchEvent(new Event("error"));
    });
    expect(photo()).toBeNull();

    // A new photo is a new link: it shows again.
    view.rerender(<ResumeRenderer resume={resume("https://cdn.example/new.jpg")} template={template} />);
    expect(photo()?.getAttribute("src")).toBe("https://cdn.example/new.jpg");
  });
});
