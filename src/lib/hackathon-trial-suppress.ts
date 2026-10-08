import {
  INTERVIEW_RETURN_TO_PARAM,
  isHackathonDashboardReturn,
} from "@/lib/interview-return-to";

/** True when the user is in a hackathon journey (URL), even before /me loads. */
export function isHackathonTrialContextFromUrl(
  pathname: string | null | undefined,
  searchParams: URLSearchParams | null | undefined,
): boolean {
  const path = pathname ?? "";
  if (path.startsWith("/hackathon/") || path.startsWith("/hackathon-2026")) {
    return true;
  }
  if (!searchParams) return false;

  const returnTo =
    searchParams.get("returnTo") ?? searchParams.get(INTERVIEW_RETURN_TO_PARAM);
  if (isHackathonDashboardReturn(returnTo)) return true;

  const redirect = searchParams.get("redirect_url");
  if (redirect && isHackathonDashboardReturn(decodeURIComponent(redirect))) {
    return true;
  }

  return false;
}
