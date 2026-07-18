"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { FileEdit, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { resumeApi, type Resume } from "@/lib/api";
import { TEMPLATES_CATALOG } from "@/configs/resume-templates/templates-catalog";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn, formatDate, getScoreColor } from "@/lib/utils";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";

function resumeTemplateLabel(templateId: string): string {
  return TEMPLATES_CATALOG.find((t) => t.id === templateId)?.name ?? templateId;
}

function resumeTitle(resume: Resume): string {
  return resume.title?.trim() || "Untitled resume";
}

export type ProfileDesignedResumePickerHandle = {
  open: () => void;
};

export const ProfileDesignedResumePicker = forwardRef<
  ProfileDesignedResumePickerHandle,
  Readonly<{
    onDefaultChanged?: () => void;
    onDefaultResumeChange?: (resume: Resume | null) => void;
  }>
>(function ProfileDesignedResumePicker(
  { onDefaultChanged, onDefaultResumeChange },
  ref,
) {
  const { user, isLoaded } = useUser();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadResumes = useCallback(async (): Promise<Resume[]> => {
    if (!user?.id) return [];
    try {
      setLoading(true);
      const data = await resumeApi.list(user.id);
      setResumes(data);
      const current = data.find((r) => r.isDefault) ?? null;
      onDefaultResumeChange?.(current);
      return data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load designed resumes"));
      onDefaultResumeChange?.(null);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id, onDefaultResumeChange]);

  useEffect(() => {
    if (isLoaded && user?.id) {
      void loadResumes();
    }
  }, [isLoaded, user?.id, loadResumes]);

  const openDialog = useCallback(async () => {
    setSearch("");
    setDialogOpen(true);
    const data = await loadResumes();
    const current = data.find((r) => r.isDefault);
    setSelectedId(current?.resumeId ?? data[0]?.resumeId ?? null);
  }, [loadResumes]);

  useImperativeHandle(ref, () => ({ open: () => void openDialog() }), [
    openDialog,
  ]);

  useEffect(() => {
    if (!dialogOpen) {
      setSearch("");
    }
  }, [dialogOpen]);

  const filteredResumes = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...resumes].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    if (!q) return sorted;
    return sorted.filter((resume) => {
      const title = resumeTitle(resume);
      const template = resumeTemplateLabel(resume.templateId);
      return (
        title.toLowerCase().includes(q) || template.toLowerCase().includes(q)
      );
    });
  }, [resumes, search]);

  const selectedResume = resumes.find((r) => r.resumeId === selectedId) ?? null;

  const handleSetDefault = async () => {
    if (!selectedResume) return;
    if (selectedResume.isDefault) {
      setDialogOpen(false);
      return;
    }
    if (!selectedResume.pdfS3Key) {
      toast.error(
        "Generate a PDF from the resume editor before setting it as default.",
      );
      return;
    }

    try {
      setSaving(true);
      const updated = await resumeApi.update(selectedResume.resumeId, {
        isDefault: true,
      });
      await loadResumes();
      onDefaultResumeChange?.(updated);
      onDefaultChanged?.();
      toast.success(
        `"${resumeTitle(selectedResume)}" is now your default resume`,
      );
      setDialogOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not set default resume"));
    } finally {
      setSaving(false);
    }
  };

  const canConfirm =
    selectedResume &&
    !selectedResume.isDefault &&
    Boolean(selectedResume.pdfS3Key);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="flex max-h-[min(640px,90vh)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border/60 px-5 py-4 text-left">
          <DialogTitle>Set default resume</DialogTitle>
          <DialogDescription>
            Search your designed resumes, select one, and set it as default.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-border/60 px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title or template…"
              className="h-10 pl-9"
              autoFocus
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
            </div>
          ) : resumes.length === 0 ? (
            <div className="py-8 text-center">
              <FileEdit className="mx-auto mb-2 h-8 w-8 text-muted-foreground/70" />
              <p className="text-sm font-medium text-foreground">
                No designed resumes yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create one in the resume builder first.
              </p>
              <Link href="/dashboard/resumes/new" className="mt-4 inline-block">
                <Button size="sm" className={institutePrimaryClass}>
                  Create resume
                </Button>
              </Link>
            </div>
          ) : filteredResumes.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No resumes match your search.
            </p>
          ) : (
            <ul className="space-y-2" aria-label="Designed resumes">
              {filteredResumes.map((resume) => {
                const isSelected = selectedId === resume.resumeId;
                const isDefault = resume.isDefault;
                const hasPdf = Boolean(resume.pdfS3Key);
                const hasAts =
                  typeof resume.atsScore === "number" &&
                  Number.isFinite(resume.atsScore);

                return (
                  <li key={resume.resumeId}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      disabled={!hasPdf}
                      onClick={() => setSelectedId(resume.resumeId)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                        isSelected
                          ? "border-[#7367F0] bg-[#7367F0]/5 ring-1 ring-[#7367F0]/30"
                          : "border-border/60 bg-card hover:border-[#7367F0]/30",
                        !hasPdf && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                            isSelected
                              ? "border-[#7367F0] bg-[#7367F0]"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {isSelected ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          ) : null}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground">
                              {resumeTitle(resume)}
                            </p>
                            {isDefault ? (
                              <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Current default
                              </span>
                            ) : null}
                            {!hasPdf ? (
                              <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                PDF needed
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {resumeTemplateLabel(resume.templateId)}
                            {hasAts ? (
                              <>
                                {" · ATS "}
                                <span
                                  className={cn(
                                    "font-medium",
                                    getScoreColor(resume.atsScore ?? 0),
                                  )}
                                >
                                  {resume.atsScore}
                                </span>
                              </>
                            ) : null}
                            {" · Updated "}
                            {formatDate(resume.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 px-5 py-4 sm:justify-between">
          <Link
            href="/dashboard/resumes"
            className="hidden text-xs font-medium text-[#7367F0] hover:underline sm:inline-block"
            onClick={() => setDialogOpen(false)}
          >
            Open resume builder
          </Link>
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className={institutePrimaryClass}
              disabled={saving || !canConfirm}
              onClick={() => void handleSetDefault()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Set as default"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ProfileDesignedResumePicker.displayName = "ProfileDesignedResumePicker";
