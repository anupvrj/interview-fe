import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Value for `<input type="datetime-local" />` in local timezone */
export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Non-empty lines from a textarea → ordered question list for institution scheduling. */
export function parseQuestionLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Matches interview-core billing: ceil(session seconds / 60) × this rate. */
export const INTERVIEW_CREDITS_PER_MINUTE = 5;

export type InterviewCreditsInput = {
  creditsCharged?: number;
  session?: { duration?: number };
};

/** Credits for one interview: stored charge when present, else estimated from session length. */
export function getInterviewCreditsUsed(
  interview: InterviewCreditsInput,
): number | null {
  if (
    typeof interview.creditsCharged === "number" &&
    Number.isFinite(interview.creditsCharged)
  ) {
    return interview.creditsCharged;
  }
  const sec = interview.session?.duration;
  if (typeof sec === "number" && Number.isFinite(sec) && sec > 0) {
    return Math.ceil(sec / 60) * INTERVIEW_CREDITS_PER_MINUTE;
  }
  return null;
}

/** Sum credits across interviews that have a known or estimable charge. */
export function sumInterviewCreditsUsed(
  interviews: InterviewCreditsInput[],
): number {
  return interviews.reduce((sum, i) => {
    const c = getInterviewCreditsUsed(i);
    return c != null ? sum + c : sum;
  }, 0);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-yellow-600";
  return "text-red-600";
}

export function getScoreGradient(score: number): string {
  if (score >= 80) return "from-green-500 to-emerald-500";
  if (score >= 60) return "from-blue-500 to-cyan-500";
  if (score >= 40) return "from-yellow-500 to-orange-500";
  return "from-red-500 to-pink-500";
}

const SCHEDULE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Candidate may start from 24h before scheduledAt until expiresAt (if set). */
export function scheduledInterviewCanStartNow(
  scheduledAt: string | Date,
  expiresAt?: string | Date | null
): { canStart: boolean; reason: "too_early" | "expired" | "ok" } {
  const now = Date.now();
  const sched = new Date(scheduledAt).getTime();
  if (now < sched - SCHEDULE_WINDOW_MS) {
    return { canStart: false, reason: "too_early" };
  }
  if (expiresAt != null && String(expiresAt).trim() !== "") {
    const ex = new Date(expiresAt).getTime();
    if (!Number.isNaN(ex) && now > ex) {
      return { canStart: false, reason: "expired" };
    }
  }
  return { canStart: true, reason: "ok" };
}
