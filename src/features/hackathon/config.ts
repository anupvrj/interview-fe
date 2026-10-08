export const HACKATHON_SLUG = "hackathon-2026";
export const HACKATHON_LANDING_PATH = "/hackathon-2026";
export const HACKATHON_ADMIN_PATH = "/super-admin/hackathons";
export const HACKATHON_FEATURE_KEY = "hackathon";

/** Fallback display targets when an event has not set its own. */
export const HACKATHON_TARGETS = { atsScore: 75, interviewScore: 70 } as const;

export function hackathonPublicPath(slug: string): string {
  return `/hackathon/${slug}`;
}

export function hackathonDashboardPath(slug: string): string {
  return `/hackathon/${slug}/dashboard`;
}

export function hackathonProfilePath(slug: string): string {
  return `/hackathon/${slug}/profile`;
}

export function hackathonLandingPath(slug: string): string {
  return slug === HACKATHON_SLUG ? HACKATHON_LANDING_PATH : hackathonPublicPath(slug);
}

/** @deprecated Use slug-aware helpers. Kept for the 2026 marketing landing. */
export const HACKATHON_DASHBOARD_PATH = hackathonDashboardPath(HACKATHON_SLUG);
export const HACKATHON_PROFILE_PATH = hackathonProfilePath(HACKATHON_SLUG);
