import type { ReadonlyURLSearchParams } from "next/navigation";
import { HACKATHON_ADMIN_PATH } from "../config";
import type { AdminParticipantSort, ParticipantStatus, SocialReviewStatus } from "../api";

export type SubmissionsListFilters = {
  q: string;
  status: ParticipantStatus | "all";
  socialReview: SocialReviewStatus | "all";
  missingVideo: "all" | "yes";
  sort: AdminParticipantSort;
  page: number;
  /** challengeIds — participant must have passed all selected (AND). */
  passedChallenges: string[];
};

const SORTS: AdminParticipantSort[] = ["recent", "ats", "interview", "completed"];
const STATUSES: ParticipantStatus[] = [
  "registered",
  "in_progress",
  "completed",
  "disqualified",
  "withdrawn",
  "suspended",
];
const SOCIAL: SocialReviewStatus[] = ["none", "pending", "approved", "rejected"];

function parseStatus(raw: string | null): ParticipantStatus | "all" {
  if (!raw) return "all";
  return STATUSES.includes(raw as ParticipantStatus) ? (raw as ParticipantStatus) : "all";
}

function parseSocial(raw: string | null): SocialReviewStatus | "all" {
  if (!raw) return "all";
  return SOCIAL.includes(raw as SocialReviewStatus) ? (raw as SocialReviewStatus) : "all";
}

function parseSort(raw: string | null): AdminParticipantSort {
  if (raw && SORTS.includes(raw as AdminParticipantSort)) return raw as AdminParticipantSort;
  return "recent";
}

export function parseSubmissionsListSearchParams(
  searchParams: ReadonlyURLSearchParams | URLSearchParams,
): SubmissionsListFilters {
  const pageRaw = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const passedRaw = searchParams.get("challenges") ?? searchParams.get("passedChallenges") ?? "";
  const passedChallenges = passedRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    q: searchParams.get("q")?.trim() ?? "",
    status: parseStatus(searchParams.get("status")),
    socialReview: parseSocial(searchParams.get("social")),
    missingVideo: searchParams.get("video") === "yes" ? "yes" : "all",
    sort: parseSort(searchParams.get("sort")),
    page: Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1,
    passedChallenges,
  };
}

export function buildSubmissionsListQueryString(filters: SubmissionsListFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.socialReview !== "all") params.set("social", filters.socialReview);
  if (filters.missingVideo === "yes") params.set("video", "yes");
  if (filters.sort !== "recent") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.passedChallenges.length) params.set("challenges", filters.passedChallenges.join(","));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function submissionsListHref(hackathonId: string, filters: SubmissionsListFilters): string {
  return `${HACKATHON_ADMIN_PATH}/${hackathonId}/submissions${buildSubmissionsListQueryString(filters)}`;
}

export function participantDetailHref(
  hackathonId: string,
  participantId: string,
  listFilters: SubmissionsListFilters,
): string {
  const returnTo = submissionsListHref(hackathonId, listFilters);
  const params = new URLSearchParams();
  params.set("returnTo", returnTo);
  return `${HACKATHON_ADMIN_PATH}/${hackathonId}/participants/${participantId}?${params.toString()}`;
}

/** Safe return path from ?returnTo= (must stay under super-admin). */
export function resolveAdminReturnTo(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("/super-admin/") && !decoded.includes("://")) return decoded;
  } catch {
    /* ignore */
  }
  return fallback;
}
