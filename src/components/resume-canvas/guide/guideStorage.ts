/**
 * What the editor guide remembers, per user, in this browser. Only UI hints live here —
 * nothing about the resume itself — so losing it just means the guide shows again.
 */
export type GuideState = {
  /** The tour was finished or skipped (either way, don't start it on its own again). */
  tour: "done" | "skipped" | null;
  /** Existing users get one "Take a 30-sec tour?" prompt. */
  prompted: boolean;
  /** Setup checklist closed for good (finished, or dismissed). */
  checklistClosed: boolean;
  /** Editor tools opened at least once (their beacons stop pulsing). */
  explored: string[];
  /** One-off milestones that can't be read from the resume ("fixed", "exported"). */
  milestones: string[];
};

const EMPTY: GuideState = { tour: null, prompted: false, checklistClosed: false, explored: [], milestones: [] };
const key = (userId: string) => `ix:editorGuide:v1:${userId}`;

export function readGuide(userId: string): GuideState {
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<GuideState>;
    return {
      tour: parsed.tour === "done" || parsed.tour === "skipped" ? parsed.tour : null,
      prompted: parsed.prompted === true,
      checklistClosed: parsed.checklistClosed === true,
      explored: Array.isArray(parsed.explored) ? parsed.explored.filter((x) => typeof x === "string") : [],
      milestones: Array.isArray(parsed.milestones) ? parsed.milestones.filter((x) => typeof x === "string") : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export function writeGuide(userId: string, state: GuideState): void {
  try {
    window.localStorage.setItem(key(userId), JSON.stringify(state));
  } catch {
    /* private mode / full storage: the guide just won't remember */
  }
}
