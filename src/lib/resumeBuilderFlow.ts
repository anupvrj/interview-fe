/**
 * The resume builder's way in: the sign-up form (Google or email), then the dashboard's
 * new-resume steps (template, old resume or sample, optional job description → AI writes it),
 * then the editor. The general app onboarding waits until their resume is built.
 */

/** Where sign-up from the resume builder lands: the existing new-resume flow. */
export const RESUME_BUILDER_FLOW_PATH = "/dashboard/resumes/new";

const FLAG_KEY = "ix-resume-builder-flow";
/** Long enough to finish email verification in another tab and build the resume. */
const FLOW_TTL_MS = 24 * 60 * 60 * 1000;

type FlowState = { until: number; stage: "building" | "built" };

function readFlow(): FlowState | null {
  try {
    const raw = localStorage.getItem(FLAG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FlowState>;
    if (typeof parsed.until === "number" && parsed.until > Date.now() && (parsed.stage === "building" || parsed.stage === "built")) {
      return parsed as FlowState;
    }
    localStorage.removeItem(FLAG_KEY);
  } catch {
    /* storage unavailable or a broken entry */
  }
  return null;
}

function writeFlow(stage: FlowState["stage"]) {
  try {
    localStorage.setItem(FLAG_KEY, JSON.stringify({ until: Date.now() + FLOW_TTL_MS, stage }));
  } catch {
    /* private mode: they just see onboarding first */
  }
}

/** Set before sign-in from the public builder: onboarding waits while they build. */
export function startResumeBuilderFlow(): void {
  writeFlow("building");
}

/** Still building (signed up, no resume yet): onboarding sends them back to the builder. */
export function inResumeBuilderFlow(): boolean {
  return readFlow()?.stage === "building";
}

/** Resume created: the editor stays theirs, but other pages ask for onboarding as usual. */
export function markResumeBuilderFlowBuilt(): void {
  if (readFlow()) writeFlow("built");
}

export function endResumeBuilderFlow(): void {
  try {
    localStorage.removeItem(FLAG_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** While building (and in the editor right after), the resume pages come before onboarding. */
export function builderFlowSkipsOnboarding(pathname: string): boolean {
  return pathname.startsWith("/dashboard/resumes") && readFlow() !== null;
}
