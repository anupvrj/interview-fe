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
import { Interview, interviewApi } from "@/lib/api";
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

const TABLE_HEADERS = [
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
  };
  return badges[status] ?? badges.draft;
}

function sessionTypeLabel(interview: Interview): string {
  return interviewRoundLabel(interview);
}

function renderUnifiedRowActions(
  row: DashboardRecentSessionRow,
  playVideo: (interviewId: string) => void,
) {
  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {row.canPlayRecording && row.interviewId && (
        <IconActionButton
          title="Play recording"
          onClick={() => playVideo(row.interviewId!)}
        >
          <PlayCircle className="h-4 w-4" strokeWidth={1.75} />
        </IconActionButton>
      )}
      {row.reportHref &&
        (row.status === "completed" ||
          row.status === "processing" ||
          row.status === "failed") && (
          <IconActionButton title="View report" href={row.reportHref}>
            <Eye className="h-4 w-4" strokeWidth={1.75} />
          </IconActionButton>
        )}
      {row.showGenerateReport && row.reportHref && (
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
      )}
      {row.continueHref &&
        (row.status === "draft" || row.status === "active") && (
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
        )}
      {row.status === "processing" && row.reportHref && (
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
      )}
    </div>
  );
}

function renderUnifiedRowActions(
  row: DashboardRecentSessionRow,
  playVideo: (interviewId: string) => void,
) {
  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {row.canPlayRecording && row.interviewId && (
        <IconActionButton
          title="Play recording"
          onClick={() => playVideo(row.interviewId!)}
        >
          <PlayCircle className="h-4 w-4" strokeWidth={1.75} />
        </IconActionButton>
      )}
      {row.reportHref &&
        (row.status === "completed" ||
          row.status === "processing" ||
          row.status === "failed") && (
          <IconActionButton title="View report" href={row.reportHref}>
            <Eye className="h-4 w-4" strokeWidth={1.75} />
          </IconActionButton>
        )}
      {row.showGenerateReport && row.reportHref && (
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
      )}
      {row.continueHref &&
        (row.status === "draft" || row.status === "active") && (
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
        )}
      {row.status === "processing" && row.reportHref && (
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
      )}
    </div>
  );
}

function IconActionButton({
  title,
  onClick,
  children,
  href,
  disabled,
  destructive,
}: {
  title: string;
  onClick?: () => void;
  children: ReactNode;
  href?: string;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const className = cn(
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
    destructive
      ? "text-rose-400 hover:bg-rose-50 hover:text-rose-600"
      : "text-[#a8aaae] hover:bg-[#7367F0]/[0.06] hover:text-[#7367F0]",
    disabled && "pointer-events-none opacity-50",
  );

  if (href) {
    return (
      <Link href={href} title={title} aria-label={title} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
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

  const playVideo = async (interviewId: string) => {
    try {
      const { videoUrl } = await interviewApi.getRecordingVideoUrl(interviewId);
      if (!videoUrl?.trim()) {
        onVideoUnavailable();
        return;
      }
      window.open(videoUrl, "_blank");
    } catch (error) {
      console.error("Error getting video URL:", error);
      onVideoUnavailable();
    }
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
              {TABLE_HEADERS.map((header) => (
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
                      {renderUnifiedRowActions(row, playVideo)}
                    </td>
                  </tr>
                ))
              : (pageItems as Interview[]).map((interview) => {
              const role = interview.metadata.role || "General Interview";
              const durationLabel = formatInterviewDurationMinutes(
                interview.session?.duration,
              );
              const creditsUsed = getInterviewCreditsUsed(interview);
              const subtitle =
                interview.metadata.targetCompany?.trim() ||
                formatDate(interview.createdAt);
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
                    <div className="flex flex-wrap items-center gap-0.5">
                      {interview.status === "completed" && (
                        <>
                          <IconActionButton
                            title="Play recording"
                            onClick={() => playVideo(interview.interviewId)}
                          >
                            <PlayCircle
                              className="h-4 w-4"
                              strokeWidth={1.75}
                            />
                          </IconActionButton>
                          <IconActionButton
                            title="View report"
                            href={`/dashboard/interviews/${interview.interviewId}/report`}
                          >
                            <Eye className="h-4 w-4" strokeWidth={1.75} />
                          </IconActionButton>
                          {!interview.report && (
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
                        </>
                      )}
                      {interview.status === "failed" && (
                        <>
                          <IconActionButton
                            title="Play recording"
                            onClick={() => playVideo(interview.interviewId)}
                          >
                            <PlayCircle
                              className="h-4 w-4"
                              strokeWidth={1.75}
                            />
                          </IconActionButton>
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
                        </>
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
                      {interview.status === "processing" &&
                        (onDelete ? (
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
                        ) : (
                          <IconActionButton
                            title="View interview"
                            href={`/dashboard/interviews/${interview.interviewId}/report`}
                          >
                            <Eye className="h-4 w-4" strokeWidth={1.75} />
                          </IconActionButton>
                        ))}
                      {interview.status === "active" &&
                        (onDelete ? (
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
                        ) : (
                          <IconActionButton
                            title="View interview"
                            href={`/dashboard/interviews/${interview.interviewId}/report`}
                          >
                            <Eye className="h-4 w-4" strokeWidth={1.75} />
                          </IconActionButton>
                        ))}
                      {(interview.status === "draft" ||
                        interview.status === "active") &&
                        onDelete && (
                          <IconActionButton
                            title="Delete interview"
                            onClick={() => onDelete(interview.interviewId)}
                            destructive
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
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
