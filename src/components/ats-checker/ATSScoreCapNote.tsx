import type { ATSReportV3 } from "@/types/atsReport";

/** "Your score is held at N until you fix…": the same note on every report. */
export function ATSScoreCapNote({ report, className }: { report: ATSReportV3; className?: string }) {
  if (report.scoreCap == null || !(report.scoreCapReasons?.length ?? 0)) return null;
  return (
    <div role="note" className={className ?? "rounded-[18px] border border-amber-500/40 bg-amber-500/[0.08] px-5 py-4 text-sm"}>
      <p className="font-semibold text-foreground">Your score is held at {report.scoreCap} until you fix:</p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-muted-foreground">
        {report.scoreCapReasons!.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
