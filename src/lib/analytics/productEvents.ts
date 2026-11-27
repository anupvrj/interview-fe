import { trackEvent } from "./gtag";

/**
 * Product funnel events for the Resume Builder and ATS Checker (GA4).
 *
 * Rules: no personal data and no free text — never resume content, names, emails, job
 * descriptions, file names or AI prompts. Only ids we generate, enums, counts, buckets and
 * durations. Each event carries a `journey_id` (one per browser tab session) so a funnel
 * can be followed without identifying the person.
 */
type Events = {
  // ATS checker
  ats_checker_opened: { surface: "public" | "dashboard"; signed_in: boolean };
  ats_resume_uploaded: { signed_in: boolean; size_kb: number; has_jd: boolean };
  ats_analysis_completed: { signed_in: boolean; score_bucket: string; duration_ms: number; reused: boolean };
  ats_analysis_failed: { signed_in: boolean; reason: "network" | "server" | "rejected" | "unknown" };
  ats_recommendation_viewed: { check_id: string; locked: boolean };
  ats_improved_view_opened: { ready: boolean };
  ats_signup_clicked: { placement: string };
  ats_upload_new_clicked: { signed_in: boolean };
  ats_claim_completed: { duration_ms: number; improved: boolean; attempts: number };
  ats_claim_failed: { reason: "expired" | "error" };
  ats_score_recalculated: { surface: "dashboard" | "editor"; score_bucket: string; delta: number };
  ats_job_match_requested: { surface: "report" | "editor"; has_previous: boolean };
  ats_keywords_editor_opened: { missing: number };
  // resume builder
  resume_builder_opened: { surface: "marketing" | "new" | "guest"; signed_in: boolean };
  resume_creation_started: { source: string };
  resume_builder_signup_opened: { signed_in: boolean };
  resume_design_matched: { matched: boolean; used_ai: boolean; template_id: string };
  resume_template_selected: { template_id: string; surface: string };
  resume_ai_enhancement_requested: { kind: string };
  resume_ai_enhancement_applied: { kind: string };
  resume_ai_defend_requested: { kind: string };
  /** Resume Writer v2 finished a build (what it left for the user). */
  resume_ai_build_completed: { source: string; slots: number; suggestions: number; skills_to_confirm: number; kept_original: number; cost_usd: number; ms: number };
  /** "What's left for you": the user dealt with one item. */
  resume_whats_left_action: { kind: string; action: "done" | "dismissed" };
  resume_downloaded: { format: "pdf" | "txt" | "docx"; surface: string };
  resume_duplicated: { surface: string };
};

export type ProductEvent = keyof Events;

const JOURNEY_KEY = "ix-journey-id";

function journeyId(): string {
  try {
    let id = sessionStorage.getItem(JOURNEY_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(JOURNEY_KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

export function track<E extends ProductEvent>(event: E, params: Events[E]): void {
  trackEvent(event, { ...params, journey_id: journeyId() });
}

/** 0–100 score → a coarse bucket ("40-59"), so events never carry exact per-person scores. */
export function scoreBucket(score: number): string {
  if (!Number.isFinite(score)) return "unknown";
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s < 40) return "0-39";
  if (s < 60) return "40-59";
  if (s < 75) return "60-74";
  if (s < 90) return "75-89";
  return "90-100";
}
