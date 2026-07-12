"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  isScoreBasedPeerReportBooking,
  PeerInterviewerScoreReportContent,
} from "@/components/peer/PeerInterviewerScoreReportDialog";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import { peerApi, type PeerBooking, type PeerInterviewReport } from "@/lib/api";

export default function PeerBookingReportPage() {
  const params = useParams();
  const id = String(params.id);

  const [booking, setBooking] = useState<PeerBooking | null>(null);
  const [report, setReport] = useState<PeerInterviewReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [b, r] = await Promise.all([
        peerApi.getBooking(id),
        peerApi.getPeerReport(id).catch(() => null),
      ]);
      setBooking(b);
      setReport(r);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (
      booking?.reportStatus !== "processing" &&
      booking?.reportStatus !== "pending"
    ) {
      return;
    }
    const interval = setInterval(() => void load(), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.reportStatus]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  const isScoreReport =
    report?.transcriptSource === "interviewer_score" ||
    (booking ? isScoreBasedPeerReportBooking(booking) : false);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/peer-interviews/bookings/${id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to booking
          </Link>
        </Button>
      </div>

      {isScoreReport && booking ? (
        <>
          <div>
            <h1 className="text-2xl font-semibold">Interview report</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Based on your peer interviewer&apos;s evaluation. No Meet transcript was
              available for this session.
            </p>
          </div>
          <div className={cn(appCard, "p-4 sm:p-6")}>
            <PeerInterviewerScoreReportContent booking={booking} />
          </div>
        </>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-semibold">Peer interview report</h1>
            <p className="text-sm text-muted-foreground">
              {booking?.bookingRef} · Generated from Google Meet transcript
            </p>
          </div>

          {!report ? (
            <div className={cn(appCard, "p-6 text-center text-muted-foreground")}>
              {booking?.reportStatus === "processing" || booking?.reportStatus === "pending" ? (
                <>
                  <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#7367F0]" />
                  <p>Interview report is being generated from the meeting transcript…</p>
                </>
              ) : booking?.interviewerCandidateScore ? (
                <div className="space-y-4 text-left">
                  <p className="text-sm text-muted-foreground">
                    Meet transcript report is not available. Showing interviewer evaluation instead.
                  </p>
                  <PeerInterviewerScoreReportContent booking={booking} />
                </div>
              ) : (
                <p>
                  Report not available yet. It appears after the meeting ends and Google Meet
                  finishes processing the transcript.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className={cn(appCard, "p-6")}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall score</p>
                    <p className="text-4xl font-bold text-[#7367F0]">{report.overallScore}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    {Object.entries(report.categoryScores).map(([k, v]) => (
                      <div key={k}>
                        <p className="capitalize text-muted-foreground">{k}</p>
                        <p className="font-semibold">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {report.pass2Analysis?.overallSummary ? (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {report.pass2Analysis.overallSummary}
                  </p>
                ) : null}
              </div>

              <div className="space-y-4">
                {report.qaAnalysis.map((qa, i) => (
                  <div key={i} className={cn(appCard, "space-y-3 p-5")}>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Question {i + 1} · {qa.questionType}
                    </p>
                    <p className="font-medium">{qa.question}</p>
                    <p className="text-sm text-muted-foreground">{qa.candidateAnswer}</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Correctness</p>
                        <Progress value={qa.correctnessScore} className="h-2" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Clarity</p>
                        <Progress value={qa.clarityScore} className="h-2" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Completeness</p>
                        <Progress value={qa.completenessScore} className="h-2" />
                      </div>
                    </div>
                    <p className="text-sm">{qa.feedback}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
