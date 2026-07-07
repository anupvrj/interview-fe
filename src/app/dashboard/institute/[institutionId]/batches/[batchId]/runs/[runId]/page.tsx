"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Trophy,
  ExternalLink,
  Users,
  CalendarClock,
  BarChart3,
  UserCheck,
  FileCheck,
} from "lucide-react";
import { userApi, adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  InstituteLoader,
  InstitutePageHeader,
  InstituteStatCard,
  InstituteTableShell,
  institutePanelClass,
} from "@/components/institute/InstituteChrome";

export default function BatchScheduleRunPage({
  params,
}: {
  params: Promise<{
    institutionId: string;
    batchId: string;
    runId: string;
  }>;
}) {
  const { institutionId, batchId, runId: runIdParam } = use(params);
  const runId = decodeURIComponent(runIdParam);
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<
    ReturnType<typeof adminApi.getBatchScheduleRunDetail>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userApi.getMyProfile().then(setProfile).catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (
      profile.accessRole !== "institution_admin" &&
      profile.accessRole !== "super_admin"
    ) {
      router.replace("/dashboard");
      return;
    }
    if (
      profile.accessRole === "institution_admin" &&
      profile.institutionId &&
      String(profile.institutionId) !== institutionId
    ) {
      router.replace("/dashboard");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const d = await adminApi.getBatchScheduleRunDetail(batchId, runId);
        setData(d);
        setError(null);
      } catch (e: unknown) {
        setData(null);
        setError(
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || "Could not load this run."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [profile, institutionId, batchId, runId, router]);

  if (!profile || loading) {
    return <InstituteLoader />;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/dashboard/institute/${institutionId}/batches/${batchId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to batch
          </Link>
        </Button>
        <p className="text-sm text-red-600">{error || "Not found."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-2 w-fit text-muted-foreground hover:text-foreground"
      >
        <Link href={`/dashboard/institute/${institutionId}/batches/${batchId}`}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to batch
        </Link>
      </Button>

      <InstitutePageHeader
        badge="Interview round"
        title={data.role}
        description={
          <>
            Scheduled for {new Date(data.scheduledAt).toLocaleString()}
            {data.passingScore != null ? (
              <>
                {" "}
                · Pass threshold <span className="font-semibold text-foreground">{data.passingScore}</span>
                /100
              </>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InstituteStatCard icon={CalendarClock} label="Total scheduled" value={data.totalScheduled} />
        <InstituteStatCard
          icon={UserCheck}
          label="Interviews attended"
          value={data.interviewsStarted}
          footer="started (at least once)"
        />
        <InstituteStatCard icon={FileCheck} label="Reports completed" value={data.reportsCompleted} />
        <InstituteStatCard
          icon={BarChart3}
          label="Passed / failed"
          value={
            data.gradedWithThreshold > 0 ? (
              <>
                {data.totalPassed} / {data.totalFailed}
              </>
            ) : (
              "—"
            )
          }
          footer={
            data.gradedWithThreshold > 0
              ? "vs pass threshold"
              : "Set passing score on schedule to grade"
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InstituteStatCard
          icon={BarChart3}
          label="Average score"
          value={
            data.averageScore != null ? (
              <>
                {data.averageScore.toFixed(1)}
                <span className="text-lg font-normal text-muted-foreground"> /100</span>
              </>
            ) : (
              "—"
            )
          }
        />
        <InstituteStatCard
          icon={Trophy}
          label="Highest score"
          value={
            data.highestScore != null ? (
              <>
                {data.highestScore}
                <span className="text-lg font-normal text-muted-foreground"> /100</span>
              </>
            ) : (
              "—"
            )
          }
        />
      </div>

      {data.topPerformers.length > 0 ? (
        <Card className={cn(institutePanelClass, "overflow-hidden shadow-xl")}>
          <CardHeader className="border-b border-border/60 bg-gradient-to-r from-amber-50/40 to-card pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-amber-600" />
              Top performers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <InstituteTableShell>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-14">#</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Report</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topPerformers.map((row) => (
                    <TableRow
                      key={`${row.interviewId}-${row.rank}`}
                      className="hover:bg-muted/40"
                    >
                      <TableCell className="font-medium text-muted-foreground">{row.rank}</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {row.name || row.email || row.clerkId}
                        </div>
                        {row.name && row.email ? (
                          <div className="text-xs text-muted-foreground">{row.email}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {row.overallScore}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 gap-1" asChild>
                          <Link
                            href={`/dashboard/institute/${institutionId}/candidates/${encodeURIComponent(row.clerkId)}/reports/${encodeURIComponent(row.interviewId)}`}
                          >
                            View
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </InstituteTableShell>
          </CardContent>
        </Card>
      ) : null}

      <Card className={cn(institutePanelClass, "overflow-hidden shadow-xl")}>
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/40 to-card">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Everyone in this round
          </CardTitle>
          <CardDescription>
            Status of each scheduled slot; scores appear after the interview is completed and the
            report is ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <InstituteTableShell>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                  <TableHead>Candidate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Pass</TableHead>
                  <TableHead className="text-right">Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.participants.map((p) => (
                  <TableRow key={p.scheduleId} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {p.name || p.email || p.clerkId}
                      </div>
                      {p.email ? <div className="text-xs text-muted-foreground">{p.email}</div> : null}
                    </TableCell>
                    <TableCell className="capitalize text-sm text-foreground">{p.status}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.overallScore != null ? p.overallScore : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {p.passed === true ? (
                        <span className="text-emerald-700">Yes</span>
                      ) : p.passed === false ? (
                        <span className="text-red-600">No</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.interviewId ? (
                        <Button variant="ghost" size="sm" className="h-8 gap-1" asChild>
                          <Link
                            href={`/dashboard/institute/${institutionId}/candidates/${encodeURIComponent(p.clerkId)}/reports/${encodeURIComponent(p.interviewId)}`}
                          >
                            View
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </InstituteTableShell>
        </CardContent>
      </Card>
    </div>
  );
}
