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

/** The app user changed outside the role provider (e.g. onboarding finished here): detail is the User. */
export const PROFILE_UPDATED_EVENT = "ix-profile-updated";

/** A server-side AI build in progress, so a reloaded or reopened page can pick it up again. */
export type PendingBuildJob = { jobId: string; templateId: string; jdText: string; source: string; at: number };
const PENDING_BUILD_KEY = "it:resume-build-job";
/** Builds older than this are not picked up again (the job itself is gone after a day). */
const PENDING_BUILD_MAX_AGE_MS = 15 * 60 * 1000;

export function savePendingBuildJob(job: PendingBuildJob): void {
  try {
    localStorage.setItem(PENDING_BUILD_KEY, JSON.stringify({ ...job, jdText: job.jdText.slice(0, 6000) }));
  } catch {
    /* storage unavailable: the build still finishes in this tab */
  }
}

export function readPendingBuildJob(): PendingBuildJob | null {
  try {
    const job = JSON.parse(localStorage.getItem(PENDING_BUILD_KEY) ?? "null") as PendingBuildJob | null;
    if (!job?.jobId || Date.now() - job.at > PENDING_BUILD_MAX_AGE_MS) return null;
    return job;
  } catch {
    return null;
  }
}

export function clearPendingBuildJob(): void {
  try {
    localStorage.removeItem(PENDING_BUILD_KEY);
  } catch {
    /* ignore */
  }
}
