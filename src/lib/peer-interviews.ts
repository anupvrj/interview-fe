/** Requirements to unlock peer-to-peer interviews in the product UI. */
export const PEER_INTERVIEW_UNLOCK_MIN_COUNT = 10;
export const PEER_INTERVIEW_UNLOCK_MIN_AVG_SCORE = 80;

export type PeerInterviewInterviewLike = {
  status: string;
  createdAt: string;
  report?: { overallScore?: number | null } | null;
};

export type PeerInterviewUnlockStatus = {
  unlocked: boolean;
  /** Completed interviews with a score, newest first */
  scoredCompletedCount: number;
  /** Scores for the most recent up-to-10 completed interviews (newest first) */
  last10Scores: number[];
  /** Rounded average of last10Scores, or null if none */
  averageLast10: number | null;
};

export function getPeerInterviewUnlockStatus(
  interviews: PeerInterviewInterviewLike[],
): PeerInterviewUnlockStatus {
  const completed = interviews
    .filter(
      (i) =>
        i.status === "completed" &&
        i.report?.overallScore != null &&
        !Number.isNaN(Number(i.report.overallScore)),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const last10 = completed.slice(0, PEER_INTERVIEW_UNLOCK_MIN_COUNT);
  const last10Scores = last10.map((i) => Number(i.report!.overallScore));
  const averageLast10 =
    last10Scores.length > 0
      ? Math.round(
          last10Scores.reduce((sum, s) => sum + s, 0) / last10Scores.length,
        )
      : null;

  const unlocked =
    last10Scores.length >= PEER_INTERVIEW_UNLOCK_MIN_COUNT &&
    averageLast10 !== null &&
    averageLast10 >= PEER_INTERVIEW_UNLOCK_MIN_AVG_SCORE;

  return {
    unlocked,
    scoredCompletedCount: completed.length,
    last10Scores,
    averageLast10,
  };
}
