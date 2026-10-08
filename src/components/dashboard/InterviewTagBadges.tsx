import { interviewTagLabels } from "@/lib/dashboard-recent-sessions";

export function InterviewTagBadges({ tags }: Readonly<{ tags?: string[] }>) {
  const labels = interviewTagLabels(tags);
  if (labels.length === 0) return null;
  return (
    <>
      {labels.map((label) => (
        <span
          key={label}
          className="ml-1.5 inline-flex shrink-0 items-center rounded-full bg-sky-500/10 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300"
        >
          {label}
        </span>
      ))}
    </>
  );
}
