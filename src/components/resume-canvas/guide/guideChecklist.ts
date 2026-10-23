import type { Resume } from "@/lib/api";
import type { ChecklistItem } from "./SetupChecklist";

const SAMPLE_NAMES = /^(your name|john doe|jane doe|full name)$/i;

/** A real name plus a way to reach them. */
export function guideHasContact(content: Resume["content"] | undefined): boolean {
  const info = (content?.personalInfo ?? {}) as Record<string, unknown>;
  const name = typeof info.fullName === "string" ? info.fullName.trim() : "";
  const reach = [info.email, info.phone].some((v) => typeof v === "string" && v.trim().length > 0);
  return Boolean(name) && !SAMPLE_NAMES.test(name) && reach;
}

/** At least one job or project with a heading. */
export function guideHasContent(content: Resume["content"] | undefined): boolean {
  const filled = (list: unknown, keys: string[]) =>
    Array.isArray(list) &&
    list.some((e) => {
      if (!e || typeof e !== "object") return false;
      const record = e as Record<string, unknown>;
      return keys.some((k) => typeof record[k] === "string" && (record[k] as string).trim().length > 0);
    });
  return filled(content?.experience, ["company", "position", "title"]) || filled(content?.projects, ["name", "title"]);
}

export type ChecklistInput = {
  hackathon: boolean;
  hasContact: boolean;
  hasContent: boolean;
  atsChecked: boolean;
  /** Hackathon: sample text right now, and whether this resume had any this visit. */
  hasSample: boolean;
  hadSample: boolean;
  atsTarget: number | null;
  explored: string[];
  milestones: string[];
};

/** The "Resume setup" items. Hackathon resumes get the short path to a submission. */
export function buildChecklist(input: ChecklistInput): ChecklistItem[] {
  const ats = input.atsChecked || input.explored.includes("fix");
  const exported = input.milestones.includes("exported");
  if (input.hackathon) {
    return [
      // Only when the template's sample text was there — it's what blocks the submit.
      ...(input.hadSample ? [{ id: "sample", label: "Replace the sample text", done: !input.hasSample }] : []),
      { id: "contact", label: "Add your name & contact", done: input.hasContact },
      { id: "ats", label: input.atsTarget ? `Check your ATS score (aim for ${input.atsTarget}+)` : "Check your ATS score", done: ats },
      { id: "export", label: "Submit to Hackathon", done: exported },
    ];
  }
  return [
    { id: "contact", label: "Add your name & contact", done: input.hasContact },
    { id: "content", label: "Add experience or a project", done: input.hasContent },
    { id: "ats", label: "Check your ATS score", done: ats },
    { id: "fix", label: "Fix one issue", done: input.milestones.includes("fixed") },
    { id: "export", label: "Download your resume", done: exported },
  ];
}
