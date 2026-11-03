// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { applySuggestion, lineContaining, looseText, textAtLocation } from "../suggestionApply";

const ul = (...items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const ELEARN = "Directed the development of an impactful eLearning platform, enhancing user engagement through innovative features.";
const TEAM = "Collaborated with a talented team to deliver cutting-edge solutions in a fast-paced environment.";
const AWS = "Utilized AWS services to improve application scalability and performance.";

function resume(jobs = 3) {
  return {
    resumeId: "r1",
    profileSummary: "<p>Backend engineer building payment APIs.</p>",
    content: {
      personalInfo: { fullName: "Anup" },
      experience: Array.from({ length: jobs }, (_, i) => ({ id: `e${i}`, company: "OneOrigin", position: "Lead", startDate: "2024", description: ul(ELEARN, TEAM, AWS) })),
      skills: ["Go", "AWS"],
    },
  } as never;
}
const bullets = (r: any, job: number) => {
  const doc = new DOMParser().parseFromString(r.content.experience[job].description, "text/html");
  return Array.from(doc.querySelectorAll("li")).map((li) => li.textContent);
};

describe("applySuggestion", () => {
  it("a loosely quoted bullet (period vs comma) is found, and the rewrite replaces the whole bullet", () => {
    const out = applySuggestion(resume(1), {
      original: "Directed the development of an impactful eLearning platform.",
      improved: "Spearheaded a high-impact eLearning platform that lifted engagement by 30%.",
    })!;
    expect(out).not.toBeNull();
    expect(bullets(out.resume, 0)).toEqual(["Spearheaded a high-impact eLearning platform that lifted engagement by 30%.", TEAM, AWS]);
    expect(out.at).toEqual({ path: "experience.0.description", index: 0 });
  });

  it("with a known spot, only that job's copy of a repeated sentence changes", () => {
    const out = applySuggestion(resume(3), {
      original: TEAM,
      improved: "Partnered with a 6-person team to ship features weekly.",
      at: { path: "experience.1.description", index: 1 },
    })!;
    expect(bullets(out.resume, 0)[1]).toBe(TEAM);
    expect(bullets(out.resume, 1)[1]).toBe("Partnered with a 6-person team to ship features weekly.");
    expect(bullets(out.resume, 2)[1]).toBe(TEAM);
  });

  it("applying a second option replaces the first one in the same spot — never the whole job", () => {
    const first = applySuggestion(resume(3), { original: TEAM, improved: "Option one sentence for the team bullet here.", at: { path: "experience.1.description", index: 1 } })!;
    const second = applySuggestion(first.resume, {
      original: "Option one sentence for the team bullet here.",
      improved: "Option two, a different sentence for the same bullet.",
      at: first.at,
    })!;
    expect(bullets(second.resume, 1)).toEqual([ELEARN, "Option two, a different sentence for the same bullet.", AWS]);
    expect(second.at).toEqual({ path: "experience.1.description", index: 1 });
  });

  it("even with stale 'original' text, the known spot is replaced as one bullet (no wipe)", () => {
    const out = applySuggestion(resume(3), { original: "text that is no longer there at all", improved: "Drove teamwork to deliver advanced solutions at pace.", at: { path: "experience.1.description", index: 1 } })!;
    expect(bullets(out.resume, 1)).toEqual([ELEARN, "Drove teamwork to deliver advanced solutions at pace.", AWS]);
  });

  it("a short phrase swaps just the phrase", () => {
    const out = applySuggestion(resume(1), { original: "talented team", improved: "6-person team" })!;
    expect(bullets(out.resume, 0)[1]).toBe("Collaborated with a 6-person team to deliver cutting-edge solutions in a fast-paced environment.");
  });

  it("the summary is checked first and keeps its paragraph", () => {
    const out = applySuggestion(resume(1), { original: "Backend engineer building payment APIs", improved: "Backend engineer who built payment APIs for 4,000 merchants." })!;
    expect((out.resume as any).profileSummary).toBe("<p>Backend engineer who built payment APIs for 4,000 merchants.</p>");
    expect(out.at).toEqual({ path: "@profileSummary", index: null });
  });

  it("text that isn't on the resume: nothing changes", () => {
    expect(applySuggestion(resume(1), { original: "Built a rocket to the moon in a weekend", improved: "Something entirely new and long enough." })).toBeNull();
    // A spot that doesn't exist falls back to searching, and still refuses to guess.
    expect(applySuggestion(resume(1), { original: "nope nope nope nope nope", improved: "x y z a b c.", at: { path: "experience.9.description", index: 4 } })).toBeNull();
  });

  it("plain-text descriptions (one bullet per line)", () => {
    const r = resume(1) as any;
    r.content.experience[0].description = `${ELEARN}\n${TEAM}`;
    const out = applySuggestion(r, { original: TEAM, improved: "Partnered with design and product to ship weekly releases." })! as any;
    expect(out.resume.content.experience[0].description).toBe(`${ELEARN}\nPartnered with design and product to ship weekly releases.`);
    expect(out.at.index).toBe(1);
  });

  it("descriptions stored as an array (['<ul>…</ul>']) are edited at the known job, not the first match", () => {
    const r = resume(3) as any;
    r.content.experience.forEach((job: any) => (job.description = [job.description]));
    const out = applySuggestion(r, {
      original: TEAM,
      improved: "Partnered with a 6-person team to ship features weekly.",
      at: { path: "experience.2.description", index: 1 },
    })!;
    expect(out.at).toEqual({ path: "experience.2.description", index: 1 });
    expect(bullets(out.resume, 2)).toEqual([ELEARN, "Partnered with a 6-person team to ship features weekly.", AWS]);
    // The other jobs are untouched (still arrays).
    expect((out.resume as any).content.experience[0].description).toEqual(r.content.experience[0].description);
    expect((out.resume as any).content.experience[1].description).toEqual(r.content.experience[1].description);
  });

  it("array descriptions found by text become one field path (never '….description.0')", () => {
    const r = resume(1) as any;
    r.content.experience[0].description = [ELEARN, TEAM];
    const out = applySuggestion(r, { original: TEAM, improved: "Partnered with a 6-person team to ship features weekly." })!;
    expect(out.at).toEqual({ path: "experience.0.description", index: 1 });
    expect((out.resume as any).content.experience[0].description).toBe(`<p>${ELEARN}</p><p>Partnered with a 6-person team to ship features weekly.</p>`);
  });

  it("found by text, a repeated sentence: the 2nd card changes the 2nd copy", () => {
    const out = applySuggestion(resume(3), { original: TEAM, improved: "Partnered with a 6-person team to ship features weekly.", occurrence: 2 })!;
    expect(out.at).toEqual({ path: "experience.1.description", index: 1 });
    expect(bullets(out.resume, 0)).toEqual([ELEARN, TEAM, AWS]);
    expect(bullets(out.resume, 1)[1]).toBe("Partnered with a 6-person team to ship features weekly.");
    // Fewer copies left than asked for: the last one.
    expect(applySuggestion(resume(1), { original: TEAM, improved: "Partnered with a 6-person team to ship features weekly.", occurrence: 3 })!.at.path).toBe(
      "experience.0.description",
    );
  });

  it("textAtLocation reads one bullet (array or string field) or the whole summary", () => {
    const r = resume(2) as any;
    r.content.experience[1].description = [r.content.experience[1].description];
    expect(textAtLocation(r, { path: "experience.0.description", index: 2 })).toBe(AWS);
    expect(textAtLocation(r, { path: "experience.1.description", index: 1 })).toBe(TEAM);
    expect(textAtLocation(r, { path: "@profileSummary", index: null })).toBe("Backend engineer building payment APIs.");
    expect(textAtLocation(r, { path: "experience.0.description", index: 9 })).toBeNull();
    expect(textAtLocation(r, { path: "experience.5.description", index: 0 })).toBeNull();
  });

  it("looseText ignores punctuation, quotes and spacing", () => {
    expect(looseText("“Led  a team,” of 5.")).toBe("led a team of 5");
  });
});

// A real summary from the editor: one block of sentences with bold and a link (no <p>).
const SUMMARY =
  'Backend engineer with 8 years in Node.js and Go. Led a team of 6 that cut checkout latency by <b>42%</b> at 12M requests per day. See my work on <a href="https://github.com/me">GitHub</a>.';
function withSummary(profileSummary = SUMMARY) {
  return { resumeId: "r1", profileSummary, content: { personalInfo: { fullName: "A" }, experience: [] } } as never;
}

describe("applySuggestion in a one-block field (the summary)", () => {
  it("a rewrite of one sentence replaces that sentence only — the rest, its bold and its link stay", () => {
    const out = applySuggestion(withSummary(), {
      original: "Cut checkout latency by 42% at 12M requests per day.",
      improved: "Managed a team of 6 to achieve a 42% reduction in checkout latency at 12M daily requests.",
    })!;
    expect((out.resume as any).profileSummary).toBe(
      'Backend engineer with 8 years in Node.js and Go. Managed a team of 6 to achieve a 42% reduction in checkout latency at 12M daily requests. See my work on <a href="https://github.com/me">GitHub</a>.',
    );
    expect(out.at).toEqual({ path: "@profileSummary", index: null });
  });

  it("a second option replaces the first one, not the paragraph", () => {
    const first = applySuggestion(withSummary(), { original: "Led a team of 6 that cut checkout latency", improved: "First option sentence about the latency work." })!;
    const second = applySuggestion(first.resume, { original: "First option sentence about the latency work.", improved: "Second option, also about the latency work.", at: first.at })!;
    expect((second.resume as any).profileSummary).toBe(
      'Backend engineer with 8 years in Node.js and Go. Second option, also about the latency work. See my work on <a href="https://github.com/me">GitHub</a>.',
    );
  });

  it("a short phrase swap keeps the formatting around it", () => {
    const out = applySuggestion(withSummary(), { original: "8 years", improved: "eight years" })!;
    expect((out.resume as any).profileSummary).toBe(SUMMARY.replace("8 years", "eight years"));
  });

  it("refuses rather than wiping the summary when the sentence is gone", () => {
    expect(applySuggestion(withSummary(), { original: "", improved: "Anything long enough to be a sentence.", at: { path: "@profileSummary", index: null } })).toBeNull();
  });

  it("plain-text summaries change one sentence too", () => {
    const out = applySuggestion(withSummary("Built APIs. Shipped a payments app used by 2M people. Like hiking."), {
      original: "Shipped a payments app used by 2M people.",
      improved: "Shipped a UPI payments app now used by 2M people monthly.",
    })!;
    expect((out.resume as any).profileSummary).toBe("Built APIs. Shipped a UPI payments app now used by 2M people monthly. Like hiking.");
  });
});

describe("lineContaining", () => {
  it("gives the whole bullet a fragment comes from, so AI Coach rewrites all of it", () => {
    expect(lineContaining(resume(1), "talented team to deliver cutting-edge solutions")).toBe(TEAM);
  });

  it("gives the summary sentence, not the whole summary", () => {
    expect(lineContaining(withSummary(), "cut checkout latency by 42% at 12M requests per day")).toBe(
      "Led a team of 6 that cut checkout latency by 42% at 12M requests per day.",
    );
  });

  it("null when the quote isn't on the resume", () => {
    expect(lineContaining(resume(1), "Built a rocket to the moon in a weekend")).toBeNull();
  });
});
