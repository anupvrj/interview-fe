/** Shared Recharts styling — keep institute and candidate dashboards aligned. */

export const dashboardChartCardClass =
  "rounded-xl border border-border/80 bg-card shadow-card";

export const dashboardChartGrid = {
  strokeDasharray: "3 3" as const,
  stroke: "#e2e8f0",
};

export const dashboardChartTooltipStyle = {
  borderRadius: 8,
  borderColor: "#cbd5e1",
};

export const dashboardChartTick = { fontSize: 12 };

export const dashboardChartColors = {
  barPrimary: "#7367F0",
  barMuted: "#64748b",
  barReports: "#7367F0",
  lineScore: "#28c76f",
  lineCredits: "#0f172a",
};

export function dashboardAverageScoreTooltipFormatter(
  value: number,
  name: string,
): [string | number, string] {
  if (name === "Average score" || name === "Avg score") {
    return [`${value}/100`, name === "Avg score" ? "Average score" : name];
  }
  return [value, name];
}
