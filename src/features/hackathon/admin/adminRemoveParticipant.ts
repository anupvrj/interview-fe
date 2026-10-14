export const ADMIN_REMOVE_PARTICIPANT_DESCRIPTION =
  "Their entry, resume, interview and social submissions for this hackathon are deleted and can't be restored. Their InterviewTrix account is not affected, and they can register again from scratch.";

/** Same removal copy as the submission detail page (browser confirm). */
export function confirmAdminRemoveParticipant(who: string): boolean {
  return window.confirm(`Remove ${who} from this hackathon?\n\n${ADMIN_REMOVE_PARTICIPANT_DESCRIPTION}`);
}
