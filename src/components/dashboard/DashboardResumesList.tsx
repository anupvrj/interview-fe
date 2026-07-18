"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileEdit,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Resume } from "@/lib/api";
import { TEMPLATES_CATALOG } from "@/configs/resume-templates/templates-catalog";
import { cn, formatDate, getScoreColor } from "@/lib/utils";
import { institutePrimaryClass, instituteSecondaryClass } from "@/components/institute/InstituteChrome";

const TABLE_HEADERS = [
  "Resume",
  "Template",
  "ATS score",
  "Status",
  "Actions",
] as const;

function resumeTemplateLabel(templateId: string): string {
  return TEMPLATES_CATALOG.find((t) => t.id === templateId)?.name ?? templateId;
}

function resumeStatusBadge(resume: Resume): {
  label: string;
  className: string;
} {
  if (resume.isDefault) {
    return { label: "Default", className: "bg-emerald-50 text-emerald-700" };
  }
  if (resume.pdfS3Key) {
    return { label: "PDF ready", className: "bg-sky-50 text-sky-700" };
  }
  return { label: "In progress", className: "bg-slate-100 text-muted-foreground" };
}

function IconActionButton({
  title,
  onClick,
  children,
  href,
  disabled,
}: {
  title: string;
  onClick?: () => void;
  children: ReactNode;
  href?: string;
  disabled?: boolean;
}) {
  const className = cn(
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#a8aaae] transition-colors hover:bg-[#7367F0]/[0.06] hover:text-[#7367F0]",
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

export function DashboardResumesList({
  resumes,
  currentPage,
  itemsPerPage,
  onPageChange,
  onDownload,
  downloadingResumeId,
  onDuplicate,
  onDelete,
  duplicatingResumeId,
  deletingResumeId,
  onCreateClick,
  createLoading,
}: {
  resumes: Resume[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onDownload: (resumeId: string) => void;
  downloadingResumeId: string | null;
  onDuplicate?: (resumeId: string) => void;
  onDelete?: (resumeId: string) => void;
  duplicatingResumeId?: string | null;
  deletingResumeId?: string | null;
  onCreateClick?: () => void;
  createLoading?: boolean;
}) {
  const sortedResumes = [...resumes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const pageItems = sortedResumes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.max(1, Math.ceil(sortedResumes.length / itemsPerPage));

  if (resumes.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-[#7367F0]/10">
          <FileEdit className="h-8 w-8 text-[#7367F0]" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          No resumes yet
        </h3>
        <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground">
          Build an ATS-friendly resume, check your score, then use it for
          interviews.
        </p>
        <Link href="/dashboard/resumes/new">
          <Button
            className={institutePrimaryClass}
            onClick={
              onCreateClick
                ? (e) => {
                    e.preventDefault();
                    onCreateClick();
                  }
                : undefined
            }
            disabled={createLoading}
          >
            {createLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create your first resume
          </Button>
        </Link>
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
            {pageItems.map((resume) => {
              const status = resumeStatusBadge(resume);
              const hasAts =
                typeof resume.atsScore === "number" &&
                Number.isFinite(resume.atsScore);
              const isDownloading = downloadingResumeId === resume.resumeId;

              const isDuplicating = duplicatingResumeId === resume.resumeId;
              const isDeleting = deletingResumeId === resume.resumeId;

              return (
                <tr
                  key={resume.resumeId}
                  className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-3.5 align-top">
                    <Link
                      href={`/dashboard/resumes/${resume.resumeId}/edit`}
                      className="block truncate text-sm font-semibold text-foreground hover:text-[#7367F0]"
                    >
                      {resume.title?.trim() || "Untitled resume"}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      Updated {formatDate(resume.updatedAt)}
                    </p>
                  </td>

                  <td className="px-5 py-3.5 align-top">
                    <p className="truncate text-sm font-medium text-foreground">
                      {resumeTemplateLabel(resume.templateId)}
                    </p>
                  </td>

                  <td className="px-5 py-3.5 align-top">
                    {hasAts ? (
                      <p
                        className={cn(
                          "text-sm font-bold tabular-nums",
                          getScoreColor(resume.atsScore!),
                        )}
                      >
                        {resume.atsScore}
                        <span className="text-xs font-normal text-muted-foreground">
                          /100
                        </span>
                      </p>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 whitespace-nowrap px-3 text-xs font-semibold"
                        asChild
                      >
                        <Link href={`/dashboard/resumes/${resume.resumeId}/edit`}>
                          Check ATS Score
                        </Link>
                      </Button>
                    )}
                  </td>

                  <td className="px-5 py-3.5 align-top">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        status.className,
                      )}
                    >
                      {status.label}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 align-top">
                    <div className="inline-flex flex-nowrap items-center gap-0.5">
                      <IconActionButton
                        title="Download PDF"
                        onClick={() => onDownload(resume.resumeId)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" strokeWidth={1.75} />
                        )}
                      </IconActionButton>
                      <IconActionButton
                        title="Edit resume"
                        href={`/dashboard/resumes/${resume.resumeId}/edit`}
                      >
                        <FileEdit className="h-4 w-4" strokeWidth={1.75} />
                      </IconActionButton>
                      {onDuplicate && (
                        <IconActionButton
                          title="Duplicate resume"
                          onClick={() => onDuplicate(resume.resumeId)}
                          disabled={isDuplicating}
                        >
                          {isDuplicating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Copy className="h-4 w-4" strokeWidth={1.75} />
                          )}
                        </IconActionButton>
                      )}
                      {onDelete && (
                        <IconActionButton
                          title="Delete resume"
                          onClick={() => onDelete(resume.resumeId)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2
                              className="h-4 w-4 text-rose-500 hover:text-rose-600"
                              strokeWidth={1.75}
                            />
                          )}
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

      {sortedResumes.length > itemsPerPage && (
        <div className="flex flex-col gap-3 border-t border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, sortedResumes.length)} of{" "}
            {sortedResumes.length}
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
