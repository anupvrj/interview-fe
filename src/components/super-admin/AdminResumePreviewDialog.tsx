"use client";

import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ResumePreview = {
  title?: string;
  templateId?: string;
  profileSummary?: string;
  content?: {
    personalInfo?: { fullName?: string; email?: string; phone?: string };
    experience?: Array<{
      id?: string;
      position?: string;
      company?: string;
      startDate?: string;
      endDate?: string;
    }>;
    education?: Array<{
      id?: string;
      degree?: string;
      institution?: string;
    }>;
  };
};

export function AdminResumePreviewDialog({
  open,
  loading,
  resume,
  onOpenChange,
}: {
  open: boolean;
  loading: boolean;
  resume: ResumePreview | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{resume?.title ?? "Resume"}</DialogTitle>
          <DialogDescription>
            Read-only preview · Template {resume?.templateId ?? ""}
          </DialogDescription>
        </DialogHeader>
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {resume && !loading && (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="font-semibold text-foreground">
                {resume.content?.personalInfo?.fullName ?? "—"}
              </p>
              <p className="break-words text-muted-foreground">
                {resume.content?.personalInfo?.email ?? ""}{" "}
                {resume.content?.personalInfo?.phone
                  ? ` · ${resume.content.personalInfo.phone}`
                  : ""}
              </p>
            </div>
            {resume.profileSummary && (
              <div>
                <h5 className="mb-1 font-medium text-foreground">Summary</h5>
                <p className="whitespace-pre-wrap text-foreground">
                  {typeof resume.profileSummary === "string"
                    ? resume.profileSummary.replace(/<[^>]+>/g, " ")
                    : ""}
                </p>
              </div>
            )}
            {Array.isArray(resume.content?.experience) &&
              resume.content.experience.length > 0 && (
                <div>
                  <h5 className="mb-1 font-medium text-foreground">Experience</h5>
                  <ul className="list-inside list-disc space-y-1 text-foreground">
                    {resume.content.experience.slice(0, 8).map((ex, index) => (
                      <li key={ex.id || `${ex.company}-${index}`}>
                        {ex.position} at {ex.company}{" "}
                        {ex.startDate
                          ? `(${ex.startDate}${ex.endDate ? ` – ${ex.endDate}` : ""})`
                          : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            {Array.isArray(resume.content?.education) &&
              resume.content.education.length > 0 && (
                <div>
                  <h5 className="mb-1 font-medium text-foreground">Education</h5>
                  <ul className="list-inside list-disc text-foreground">
                    {resume.content.education.slice(0, 5).map((ed, index) => (
                      <li key={ed.id || `${ed.institution}-${index}`}>
                        {ed.degree} — {ed.institution}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
