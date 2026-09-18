"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/lib/api";
import { formatDate, getScoreColor } from "@/lib/utils";

const DIMENSION_LABELS: Record<string, string> = {
  scopeRequirements: "Scope & requirements",
  componentArchitecture: "Component architecture",
  scalingDeepDive: "Scaling deep dive",
  tradeoffsCommunication: "Tradeoffs & communication",
};

export default function SuperAdminSystemDesignReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<
    ReturnType<typeof adminApi.getSystemDesignReportForAdmin>
  > | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminApi
      .getSystemDesignReportForAdmin(sessionId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e: { response?: { data?: { message?: string } } }) => {
        if (!cancelled) {
          setError(
            e?.response?.data?.message || "Failed to load system design report",
          );
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const report = data?.report;
  const fallback = data?.session.scoreReport;
  const overall =
    report?.overallScore ??
    fallback?.overallScore ??
    data?.session.score ??
    null;
  const dimensions =
    report?.dimensionScores ?? fallback?.dimensionScores ?? {};
  const verdicts =
    report?.dimensionVerdicts ?? fallback?.dimensionVerdicts ?? {};
  const summary = report?.overallSummary || fallback?.summary || "";
  const didWell = report?.whatYouDidWell?.length
    ? report.whatYouDidWell
    : fallback?.strengths || [];
  const gaps = report?.gapsInDesign?.length
    ? report.gapsInDesign
    : fallback?.improvements || [];

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title={data?.problem?.title || "System design report"}
        description={
          <>
            {data?.user.name || "Candidate"}
            {data?.user.email ? ` · ${data.user.email}` : ""}
            {data?.session.completedAt || data?.session.createdAt
              ? ` · ${formatDate(
                  (data.session.completedAt || data.session.createdAt) as string,
                )}`
              : ""}
          </>
        }
      />

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && data && (
        <div className="space-y-4">
          <Card className="overflow-hidden rounded-xl border border-border/60 shadow-card">
            <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
              <CardTitle className="text-base sm:text-lg">Overall score</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-5 sm:px-5">
              <p
                className={`text-3xl font-semibold tabular-nums ${
                  overall != null ? getScoreColor(overall) : "text-muted-foreground"
                }`}
              >
                {overall != null ? `${overall}/100` : "—"}
              </p>
            </CardContent>
          </Card>

          {Object.keys(dimensions).length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(dimensions).map(([key, value]) => (
                <Card
                  key={key}
                  className="overflow-hidden rounded-xl border border-border/60 shadow-card"
                >
                  <CardContent className="p-4 sm:p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {DIMENSION_LABELS[key] || key}
                    </p>
                    <p
                      className={`mt-1 text-xl font-semibold tabular-nums ${
                        typeof value === "number"
                          ? getScoreColor(value)
                          : "text-muted-foreground"
                      }`}
                    >
                      {typeof value === "number" ? value : "—"}
                    </p>
                    {verdicts[key] ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {verdicts[key]}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {summary ? (
            <Card className="overflow-hidden rounded-xl border border-border/60 shadow-card">
              <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
                <CardTitle className="text-base sm:text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-4 text-sm leading-relaxed text-foreground sm:px-5">
                {summary}
              </CardContent>
            </Card>
          ) : null}

          {didWell.length > 0 && (
            <Card className="overflow-hidden rounded-xl border border-border/60 shadow-card">
              <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
                <CardTitle className="text-base sm:text-lg">What went well</CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-4 sm:px-5">
                <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                  {didWell.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {gaps.length > 0 && (
            <Card className="overflow-hidden rounded-xl border border-border/60 shadow-card">
              <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
                <CardTitle className="text-base sm:text-lg">Gaps</CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-4 sm:px-5">
                <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                  {gaps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {!report && !fallback && (
            <p className="text-sm text-muted-foreground">
              No detailed report has been generated for this session yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
