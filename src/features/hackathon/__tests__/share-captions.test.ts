import { describe, expect, it } from "vitest";
import {
  formatHackathonShareCaption,
  randomShareCaption,
  SHARE_CAPTIONS,
} from "../share-captions";

describe("share-captions", () => {
  it("formatHackathonShareCaption keeps the homepage and drops the hackathon path", () => {
    const sample = SHARE_CAPTIONS[0];
    const out = formatHackathonShareCaption(sample);
    expect(out).toContain("👉 https://interviewtrix.com/");
    expect(out).not.toContain("/hiring-games-hackathon-2026");

    const rewritten = formatHackathonShareCaption(
      "Tried it\n\n👉 https://interviewtrix.com/hiring-games-hackathon-2026\n\n#InterviewTrix",
    );
    expect(rewritten).toContain("👉 https://interviewtrix.com/");
    expect(rewritten).not.toContain("/hiring-games-hackathon-2026");
  });

  it("every caption includes the shared hashtags", () => {
    for (const tag of ["#interviewtrix", "#resume", "#jobinterview", "#jobsearch", "#mockinterviews", "#hiring"]) {
      for (const caption of SHARE_CAPTIONS) {
        expect(caption).toContain(tag);
      }
    }
  });

  it("every caption tags @interviewtrix", () => {
    for (const caption of SHARE_CAPTIONS) {
      expect(caption).toMatch(/(?:^|\s)@interviewtrix(?:\s|$)/);
    }
  });

  it("randomShareCaption returns a caption from the list", () => {
    const caption = randomShareCaption();
    expect(SHARE_CAPTIONS).toContain(caption);
  });

  it("randomShareCaption can avoid the current caption when regenerating", () => {
    const current = SHARE_CAPTIONS[0];
    for (let i = 0; i < 20; i += 1) {
      const next = randomShareCaption(current);
      expect(SHARE_CAPTIONS).toContain(next);
      if (SHARE_CAPTIONS.length > 1) {
        expect(next).not.toBe(current);
      }
    }
  });
});
