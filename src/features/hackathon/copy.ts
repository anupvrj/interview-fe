import type { HackathonMe, LockReason } from "./api";

export const PROFILE_MISSING_LABELS: Record<HackathonMe["profile"]["missing"][number], string> = {
  onboarding: "profile details",
  userType: "profile type",
  targetJobRole: "the role you're applying for",
  resume: "your resume",
};

export function formatProfileMissing(missing: HackathonMe["profile"]["missing"]): string {
  const labels = missing.map((key) => PROFILE_MISSING_LABELS[key]);
  if (labels.length === 0) return "your profile details";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

export const PHASE_COPY = {
  upcoming: "Hackathon will start soon. Stay tuned...",
  ended: "Hackathon is over",
  full: "Hackathon is full. All spots have been taken.",
} as const;

export const CTA_LABELS = {
  register: "Register Now — It’s Free",
  getReady: "Get ready",
  goToChallenges: "Go to challenges",
  seeResults: "See your results",
  full: "Hackathon is full",
  ended: "Hackathon is over",
} as const;

/** Short forms of CTA_LABELS for tight spots (e.g. the mobile header). */
export const CTA_SHORT_LABELS: Record<keyof typeof CTA_LABELS, string> = {
  register: "Register",
  getReady: "Get ready",
  goToChallenges: "Challenges",
  seeResults: "Results",
  full: "Full",
  ended: "Ended",
};

export function lockReasonText(reason: LockReason, challengeNumber: number): string {
  switch (reason) {
    case "not_started":
      return PHASE_COPY.upcoming;
    case "ended":
      return "Hackathon is over. Submissions are closed.";
    case "full":
      return PHASE_COPY.full;
    case "profile_incomplete":
      return "Complete your hackathon profile and upload your resume to unlock this challenge.";
    case "previous_step":
      return challengeNumber > 1
        ? `Finish Challenge ${challengeNumber - 1} to unlock this.`
        : "Finish the previous step to unlock this.";
    case "attempt_limit":
      return "You've used all attempts for this interview.";
    case "below_pass_mark":
      return "Your score is below the passing mark. Retry if you have attempts left.";
    case "inactive_entry":
      return "Your hackathon entry is no longer active. Contact support if you think this is a mistake.";
    default:
      return "This challenge is locked.";
  }
}

const FAILURE_COPY: Record<string, string> = {
  abandoned: "Your last attempt was left unfinished, so it was closed.",
  connection_failed: "Your last attempt lost its connection.",
  interview_failed: "Your last attempt couldn't be completed.",
  interview_missing: "Your last attempt was closed before it finished.",
  report_failed: "We couldn't generate a report for your last attempt.",
  after_deadline: "Your last attempt finished after the hackathon closed.",
  never_started: "Your last attempt was never started.",
};

export function failureReasonText(reason: string | undefined): string | null {
  if (!reason) return null;
  return FAILURE_COPY[reason] ?? null;
}

export function formatIst(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso)) + " IST";
}
