/**
 * Client side of the sample-data check. The rules live on the server
 * (interview-core resumePlaceholderCheck.ts) so download, connector and
 * hackathon submission all agree.
 */
import { resumeApi, type Resume, type ResumePlaceholderIssue } from "@/lib/api";

export type { ResumePlaceholderIssue };

/**
 * Fail-open: if the check can't run (network/server error) the user can still
 * download — the hackathon rule is enforced server-side regardless.
 */
export async function fetchResumePlaceholderIssues(
  content: Resume["content"] | undefined,
): Promise<ResumePlaceholderIssue[]> {
  try {
    return await resumeApi.checkPlaceholders(content);
  } catch (error) {
    console.warn("Placeholder check unavailable:", error);
    return [];
  }
}
