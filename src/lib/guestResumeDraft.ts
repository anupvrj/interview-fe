/**
 * A resume a signed-out visitor started in the public builder, kept in this browser until
 * they sign up and it becomes a real resume in their account. localStorage (not session),
 * because email verification can finish in another tab. No heavy imports: the onboarding
 * page reads this too. Nothing here is sent anywhere until the visitor signs up.
 */

const KEY = "ix-guest-resume-draft";

/** How long an unclaimed draft is kept on the device. */
export const GUEST_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Where a signed-in visitor with a draft is taken to turn it into a resume. */
export const GUEST_DRAFT_CLAIM_PATH = "/dashboard/resumes/new?draft=guest";

/** The public builder (signed-out start). Signed-in visitors are sent to the dashboard one. */
export const GUEST_BUILDER_PATH = "/resume-builder/start";

export type GuestResumeSource = "pdf" | "scratch";

export type GuestResumeDraft = {
  templateId: string;
  content: Record<string, unknown>;
  sectionOrder: unknown[];
  source: GuestResumeSource;
  savedAt: number;
};

type Stored = { data: GuestResumeDraft; expiresAt: number };

export function saveGuestResumeDraft(draft: Omit<GuestResumeDraft, "savedAt">): boolean {
  try {
    const stored: Stored = { data: { ...draft, savedAt: Date.now() }, expiresAt: Date.now() + GUEST_DRAFT_TTL_MS };
    localStorage.setItem(KEY, JSON.stringify(stored));
    return true;
  } catch {
    return false; // private mode or full storage: the visitor can still sign up and start again
  }
}

export function loadGuestResumeDraft(): GuestResumeDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<Stored>;
    const d = stored.data;
    const valid =
      typeof stored.expiresAt === "number" &&
      stored.expiresAt > Date.now() &&
      d &&
      typeof d.templateId === "string" &&
      d.content &&
      typeof d.content === "object" &&
      Array.isArray(d.sectionOrder);
    if (!valid) {
      localStorage.removeItem(KEY);
      return null;
    }
    return d as GuestResumeDraft;
  } catch {
    return null;
  }
}

export function hasGuestResumeDraft(): boolean {
  return loadGuestResumeDraft() !== null;
}

export function forgetGuestResumeDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}

/** Sign-up that comes back to claim the draft. */
export const GUEST_DRAFT_SIGN_UP_HREF = `/sign-up?redirect_url=${encodeURIComponent(GUEST_DRAFT_CLAIM_PATH)}`;
