export function ixScoreColorClass(score: number | null | undefined): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-[#7367F0]";
  if (score >= 40) return "text-amber-600";
  return "text-rose-600";
}

export function ixScoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-[#7367F0]";
  if (score >= 40) return "bg-amber-500";
  return "bg-rose-500";
}
