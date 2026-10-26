import type { ChallengeWindow } from "@/lib/hackathon-schedule";
import { cn } from "@/lib/utils";

/** “Hackathon Submission Extended to …” with the deadline date emphasized. */
export function HackathonSubmissionExtendedMeta({
  challenge,
  className,
  dateClassName,
}: {
  challenge: Pick<ChallengeWindow, "submissionExtendedDateLabel">;
  className?: string;
  dateClassName?: string;
}) {
  return (
    <span className={className}>
      Hackathon Submission Extended to{" "}
      <span className={cn("hk-grad-text-amber font-semibold", dateClassName)}>
        {challenge.submissionExtendedDateLabel}
      </span>
    </span>
  );
}
