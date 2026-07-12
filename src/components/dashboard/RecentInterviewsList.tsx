"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  PlayCircle,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Interview, interviewApi, peerApi, systemDesignApi } from "@/lib/api";
import type { DashboardRecentSessionRow } from "@/lib/dashboard-recent-sessions";
import {
  cn,
  formatDate,
  getInterviewCreditsUsed,
  getScoreColor,
} from "@/lib/utils";
import {
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { interviewRoundLabel } from "@/lib/interview-kind";
import { toast } from "sonner";

const DEFAULT_TABLE_HEADERS = [
  "Interview",
  "Session",
  "Score",
  "Status",
  "Actions",
] as const;

function formatInterviewDurationMinutes(
  durationSeconds: number | undefined,
): string | null {
  if (
    typeof durationSeconds !== "number" ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return null;
  }
  const mins = Math.max(1, Math.ceil(durationSeconds / 60));
  return mins === 1 ? "1 min" : `${mins} min`;
}

function statusBadgeClass(status: string): string {
  const badges: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700",
    processing: "bg-sky-50 text-sky-700",
    active: "bg-amber-50 text-amber-700",
    draft: "bg-slate-100 text-muted-foreground",
    failed: "bg-rose-50 text-rose-700",
    cancelled: "bg-slate-100 text-slate-600",
  };
  return badges[status] ?? badges.draft;
}

function sessionTypeLabel(interview: Interview): string {
  return interviewRoundLabel(interview);
}

function notifyUnavailable(message = "No content available") {
  toast.message(message);
}

function renderUnifiedRowActions(
  row: DashboardRecentSessionRow,
  playRecording: (row: DashboardRecentSessionRow) => void,
) {
  const detailsHref = row.detailsHref ?? row.reportHref;
  const canPlay = Boolean(row.canPlayRecording);
  const canViewDetails = Boolean(detailsHref);

  return (
    <div className="flex flex-nowrap items-center gap-1">
      <IconActionButton
        title={canPlay ? "Play recording" : "No recording available"}
        tone="outline"
        unavailable={!canPlay}
        onClick={() => {
          if (!canPlay) {
            notifyUnavailable("No content available");
            return;
          }
          playRecording(row);
        }}
      >
        <PlayCircle className="h-3.5 w-3.5" />
      </IconActionButton>

      <IconActionButton
        title={canViewDetails ? "View details" : "No details available"}
        tone="primary"
        unavailable={!canViewDetails}
        href={canViewDetails ? detailsHref : undefined}
        onClick={
          canViewDetails
            ? undefined
            : () => notifyUnavailable("No content available")
        }
      >
        <Eye className="h-3.5 w-3.5" />
      </IconActionButton>

      {row.showGenerateReport && row.reportHref ? (
        <Link
          href={row.reportHref}
          title="Generate Report"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-8 px-2 text-xs text-[#7367F0] hover:bg-[#7367F0]/10 hover:text-[#7367F0]",
          )}
        >
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          Report
        </Link>
      ) : null}

      {row.continueHref &&
      (row.status === "draft" || row.status === "active") ? (
        <Link
          href={row.continueHref}
          className={cn(
            buttonVariants({ size: "sm" }),
            institutePrimaryClass,
            "h-8 gap-1 px-3 text-xs",
          )}
        >
          <PlayCircle className="h-3.5 w-3.5" />
          {row.status === "draft" ? "Start" : "Continue"}
        </Link>
      ) : null}

      {row.status === "processing" && row.reportHref ? (
        <Link
          href={row.reportHref}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-8 gap-1 px-2 text-xs text-[#7367F0] hover:bg-[#7367F0]/10 hover:text-[#7367F0]",
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          Processing
        </Link>
      ) : null}
    </div>
  );
}

function IconActionButton({
  title,
  onClick,
  children,
  href,
  unavailable,
  tone = "outline",
}: {
  title: string;
  onClick?: () => void;
  children: ReactNode;
  href?: string;
  unavailable?: boolean;
  tone?: "outline" | "primary" | "destructive";
}) {
  const className = cn(
    "h-8 w-8 shrink-0",
    tone === "primary" &&
      "bg-[#7367F0] text-white hover:bg-[#6e62e5] hover:text-white",
    tone === "destructive" &&
      "border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700",
    unavailable && "cursor-not-allowed opacity-40",
  );

  if (href && !unavailable) {
    return (
      <Button
        asChild
        variant={tone === "outline" || tone === "destructive" ? "outline" : "default"}
        size="icon"
        className={className}
      >
        <Link href={href} title={title} aria-label={title}>
          {children}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={
        tone === "primary"
          ? "default"
          : "outline"
      }
      size="icon"
      title={title}
      aria-label={title}
      aria-disabled={unavailable || undefined}
      onClick={onClick}
      className={className}
    >
      {children}
    </Button>
  );
}

export function RecentInterviewsList({
  interviews,
  sessionRows,
  currentPage,
  itemsPerPage,
  onPageChange,
  onVideoUnavailable,
  onDelete,
  getDraftActiveHref,
  emptyDescription,
  emptyCtaHref,
  emptyCtaLabel,
  tableHeaders = DEFAULT_TABLE_HEADERS,
}: {
  interviews?: Interview[];
  sessionRows?: DashboardRecentSessionRow[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onVideoUnavailable: () => void;
  onDelete?: (interviewId: string) => void;
  getDraftActiveHref?: (interviewId: string) => string;
  emptyDescription?: ReactNode;
  emptyCtaHref?: string | null;
  emptyCtaLabel?: string;
  tableHeaders?: readonly string[];
}) {
  const useUnified = sessionRows != null;
  const listLength = useUnified ? sessionRows.length : (interviews?.length ?? 0);
  const pageItems = useUnified
    ? sessionRows!.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      )
    : interviews!.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      );
  const totalPages = Math.ceil(listLength / itemsPerPage);

  const playRecording = async (row: DashboardRecentSessionRow) => {
    try {
      let videoUrl = "";
      if (row.kind === "systemDesign" && row.systemDesignSessionId) {
        const res = await systemDesignApi.getRecordingPlaybackUrl(
          row.systemDesignSessionId,
        );
        videoUrl = res.videoUrl;
      } else if (row.kind === "peer" && row.peerBookingId) {
        const res = await peerApi.getRecordingVideoUrl(row.peerBookingId);
        videoUrl = res.url;
      } else if (row.interviewId) {
        const res = await interviewApi.getRecordingVideoUrl(row.interviewId);
        videoUrl = res.videoUrl;
      }

      if (!videoUrl?.trim()) {
        notifyUnavailable("No content available");
        onVideoUnavailable();
        return;
      }
      window.open(videoUrl, "_blank");
    } catch (error) {
      console.error("Error getting video URL:", error);
      notifyUnavailable("No content available");
      onVideoUnavailable();
    }
  };

  const playVideo = async (interviewId: string) => {
    await playRecording({
      key: interviewId,
      kind: "screening",
      title: "",
      subtitle: "",
      sessionLabel: "",
      score: null,
      status: "completed",
      sortAt: "",
      interviewId,
      canPlayRecording: true,
    });
  };

  if (listLength === 0) {
    const ctaHref =
      emptyCtaHref === null
        ? null
        : (emptyCtaHref ?? "/dashboard/interviews/new");
    return (
      <div className="px-5 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-[#7367F0]/10">
          <FileText className="h-8 w-8 text-[#7367F0]" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          No interviews yet
        </h3>
        <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground">
          {emptyDescription ??
            "Start AI interview practice for your target role and company."}
        </p>
        {ctaHref ? (
          <Link href={ctaHref}>
            <Button className={institutePrimaryClass}>
              <Plus className="mr-2 h-4 w-4" />{" "}
              {emptyCtaLabel ?? "Create your first interview"}
            </Button>
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[24%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border/70">
              {tableHeaders.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {useUnified
              ? (pageItems as DashboardRecentSessionRow[]).map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-5 py-3.5 align-top">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {row.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.subtitle}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <p className="truncate text-sm font-medium text-foreground">
                        {row.sessionLabel}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      {row.score != null ? (
                        <p
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            getScoreColor(row.score),
                          )}
                        >
                          {row.score}
                          <span className="text-xs font-normal text-muted-foreground">
                            /100
                          </span>
                        </p>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                          statusBadgeClass(row.status),
                        )}
                      >
                        {row.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      {renderUnifiedRowActions(row, playRecording)}
                    </td>
                  </tr>
                ))
              : (pageItems as Interview[]).map((interview) => {
              const role = interview.metadata.role || "General Interview";
              const durationLabel = formatInterviewDurationMinutes(
                interview.session?.duration,
              );
              const creditsUsed = getInterviewCreditsUsed(interview);
              const company = interview.metadata.targetCompany?.trim();
              const createdLabel = formatDate(interview.createdAt);
              const subtitle = company
                ? `${company} · ${createdLabel}`
                : createdLabel;
              const language =
                interview.metadata.language === "hi" ? "Hindi" : "English";

              return (
                <tr
                  key={interview._id}
                  className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-3.5 align-top">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {role}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {subtitle}
                    </p>
                  </td>

                  <td className="px-5 py-3.5 align-top">
                    <p className="truncate text-sm font-medium text-foreground">
                      {sessionTypeLabel(interview)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {language}
                      {durationLabel ? ` · ${durationLabel}` : ""}
                      {creditsUsed != null ? ` · ${creditsUsed} cr` : ""}
                    </p>
                  </td>

                  <td className="px-5 py-3.5 align-top">
                    {interview.report ? (
                      <p
                        className={cn(
                          "text-sm font-bold tabular-nums",
                          getScoreColor(interview.report.overallScore),
                        )}
                      >
                        {interview.report.overallScore}
                        <span className="text-xs font-normal text-muted-foreground">
                          /100
                        </span>
                      </p>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 align-top">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                        statusBadgeClass(interview.status),
                      )}
                    >
                      {interview.status}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 align-top">
                    <div className="flex flex-nowrap items-center gap-1">
                      {(() => {
                        const canPlay =
                          interview.status === "completed" ||
                          interview.status === "failed";
                        const detailsHref =
                          interview.status === "completed" ||
                          interview.status === "processing"
                            ? `/dashboard/interviews/${interview.interviewId}/report`
                            : interview.status === "draft" ||
                                interview.status === "active"
                              ? (getDraftActiveHref?.(interview.interviewId) ??
                                `/interview/${interview.interviewId}/realtime`)
                              : interview.status === "failed"
                                ? `/dashboard/interviews/${interview.interviewId}/report`
                                : undefined;
                        const canViewDetails = Boolean(detailsHref);

                        return (
                          <>
                            <IconActionButton
                              title={
                                canPlay
                                  ? "Play recording"
                                  : "No recording available"
                              }
                              tone="outline"
                              unavailable={!canPlay}
                              onClick={() => {
                                if (!canPlay) {
                                  notifyUnavailable("No content available");
                                  return;
                                }
                                playVideo(interview.interviewId);
                              }}
                            >
                              <PlayCircle className="h-3.5 w-3.5" />
                            </IconActionButton>
                            <IconActionButton
                              title={
                                canViewDetails
                                  ? "View details"
                                  : "No details available"
                              }
                              tone="primary"
                              unavailable={!canViewDetails}
                              href={canViewDetails ? detailsHref : undefined}
                              onClick={
                                canViewDetails
                                  ? undefined
                                  : () =>
                                      notifyUnavailable("No content available")
                              }
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </IconActionButton>
                          </>
                        );
                      })()}
                      {interview.status === "completed" && !interview.report && (
                        <Link
                          href={`/dashboard/interviews/${interview.interviewId}/report`}
                          title="Generate Report"
                          className={cn(
                            buttonVariants({
                              variant: "ghost",
                              size: "sm",
                            }),
                            "h-8 px-2 text-xs text-[#7367F0] hover:bg-[#7367F0]/10 hover:text-[#7367F0]",
                          )}
                        >
                          <Sparkles className="mr-1 h-3.5 w-3.5" />
                          Report
                        </Link>
                      )}
                      {interview.status === "failed" && (
                        <Link
                          href={`/dashboard/interviews/${interview.interviewId}/report`}
                          title="Generate Report"
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "h-8 px-2 text-xs text-[#7367F0] hover:bg-[#7367F0]/10 hover:text-[#7367F0]",
                          )}
                        >
                          <Sparkles className="mr-1 h-3.5 w-3.5" />
                          Report
                        </Link>
                      )}
                      {interview.status === "draft" && (
                        <Link
                          href={
                            getDraftActiveHref?.(interview.interviewId) ??
                            `/interview/${interview.interviewId}/realtime`
                          }
                          className={cn(
                            buttonVariants({ size: "sm" }),
                            institutePrimaryClass,
                            "h-8 gap-1 px-3 text-xs",
                          )}
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          Start
                        </Link>
                      )}
                      {interview.status === "processing" && onDelete ? (
                        <Link
                          href={`/dashboard/interviews/${interview.interviewId}/processing`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "h-8 gap-1 px-2 text-xs text-[#7367F0] hover:bg-[#7367F0]/10 hover:text-[#7367F0]",
                          )}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Processing
                        </Link>
                      ) : null}
                      {interview.status === "active" && onDelete ? (
                        <Link
                          href={
                            getDraftActiveHref?.(interview.interviewId) ??
                            `/interview/${interview.interviewId}/realtime`
                          }
                          className={cn(
                            buttonVariants({ size: "sm" }),
                            institutePrimaryClass,
                            "h-8 gap-1 px-3 text-xs",
                          )}
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          Continue
                        </Link>
                      ) : null}
                      {(interview.status === "draft" ||
                        interview.status === "active") &&
                        onDelete && (
                          <IconActionButton
                            title="Delete interview"
                            tone="destructive"
                            onClick={() => onDelete(interview.interviewId)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </IconActionButton>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {listLength > itemsPerPage && (
        <div className="flex flex-col gap-3 border-t border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, listLength)} of {listLength}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={cn(
                instituteSecondaryClass,
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage >= totalPages}
              className={cn(
                instituteSecondaryClass,
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
