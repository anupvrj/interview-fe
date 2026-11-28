/**
 * Quick instructions for the section AI, fitted to the section, the person's field and seniority —
 * so a senior engineer sees "Show system ownership and scale" and a fresher's Education shows
 * "Add relevant coursework", not the same generic "shorter / more formal" everyone gets.
 */
export type ChipContext = { roleFamily?: string; seniority?: string; targetRole?: string; empty?: boolean };

const FIELD: Record<string, { experience: string[]; summary: string[] }> = {
  software_engineering: {
    experience: ["Name the tech stack in each line", "Show system ownership and scale"],
    summary: ["Lead with my core stack and what I build"],
  },
  data_ml: {
    experience: ["Show the data, tools and the decision it drove", "Name models and pipelines I built"],
    summary: ["Lead with the problems I solve with data"],
  },
  sales: { experience: ["Lead with quota, pipeline and deals", "Show accounts and territories I own"], summary: ["Lead with my sales results"] },
  marketing: { experience: ["Show channels, campaigns and growth", "Name the tools I run campaigns with"], summary: ["Lead with the growth I drive"] },
  finance: { experience: ["Show the processes and controls I own", "Name the systems I work in"], summary: ["Lead with my finance and controls strengths"] },
  hr: { experience: ["Show hiring, people programmes and scale", "Name the HR systems I use"], summary: ["Lead with the people outcomes I deliver"] },
  operations: { experience: ["Show the processes I improved", "Show scale: sites, teams, volume"], summary: ["Lead with how I make operations run better"] },
  design: { experience: ["Show the problem, my design and the outcome", "Name tools and methods"], summary: ["Lead with the kind of products I design"] },
  healthcare: { experience: ["Show patients, settings and procedures", "Lead with care quality and safety"], summary: ["Lead with my clinical strengths and setting"] },
  teaching: { experience: ["Show classes, subjects and student outcomes", "Show curricula I built"], summary: ["Lead with what and whom I teach"] },
  product: { experience: ["Show the product decisions and their impact", "Show the teams I worked across"], summary: ["Lead with the products I've shipped"] },
};

export function sectionChips(sectionType: string, ctx: ChipContext = {}): string[] {
  const field = FIELD[ctx.roleFamily ?? ""];
  const senior = /senior|lead|principal|executive|manager|director|head/i.test(`${ctx.seniority ?? ""} ${ctx.targetRole ?? ""}`);
  const fresher = /intern|entry|fresher|junior|student|graduate/i.test(`${ctx.seniority ?? ""} ${ctx.targetRole ?? ""}`) || ctx.roleFamily === "fresher";
  const target = ctx.targetRole?.trim();
  const chips: string[] = [];
  switch (sectionType) {
    case "profileSummary":
      if (ctx.empty) chips.push("Write it from my experience below");
      chips.push(...(field?.summary ?? ["Lead with my strongest strength"]));
      if (target) chips.push(`Aim it at ${target} roles`);
      if (senior) chips.push("Show leadership and scope");
      if (fresher) chips.push("Lead with my degree, projects and internships");
      if (ctx.roleFamily === "career_switcher") chips.push("Connect my past work to the new field");
      chips.push("Shorter: 2 lines");
      break;
    case "experience":
      chips.push("Lead each job with its biggest result");
      chips.push(...(field?.experience ?? []));
      if (senior) chips.push("Show leadership, ownership and scale");
      if (fresher) chips.push("Show what I built and learned");
      chips.push("Fewer, stronger lines: 3 per job");
      break;
    case "projects":
      chips.push("Name the stack and my part", "Say what it does and who used it");
      if (fresher) chips.push("Make it read like real work experience");
      break;
    case "skills":
      chips.push(target ? `Put the skills for ${target} first` : "Most relevant first", "Group similar skills together");
      break;
    case "education":
      chips.push(fresher ? "Add relevant coursework from my resume" : "Keep it short");
      if (fresher) chips.push("Show grades and honours if listed");
      break;
    default:
      chips.push("Tidy and tighten", "Make it read more professionally");
  }
  return [...new Set(chips)].slice(0, 6);
}
