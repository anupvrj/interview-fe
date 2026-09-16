"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppSelect } from "@/components/ui/app-select";
import { RichTextEditor } from "@/components/RichTextEditor";
import { jobTrackerApi } from "@/lib/api";
import { appPanel, appSectionLabel } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  JOB_TRACKER_ACTIVE_STATUSES,
  JOB_TRACKER_STATUS_LABELS,
  type JobTrackerDetail,
  type JobTrackerStatus,
} from "@/lib/job-tracker";

export function ApplicationStatusSidebar({
  detail,
  onUpdated,
}: {
  detail: JobTrackerDetail;
  onUpdated: (next: JobTrackerDetail) => void;
}) {
  const [statusSaving, setStatusSaving] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const notesTimerRef = useRef<number | null>(null);

  const changeStatus = async (status: JobTrackerStatus) => {
    setStatusSaving(true);
    try {
      const next = await jobTrackerApi.updateStatus(
        detail.applicationId,
        status,
      );
      onUpdated(next);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    } finally {
      setStatusSaving(false);
    }
  };

  const saveNotes = async (notes: string) => {
    setNotesSaving(true);
    try {
      const next = await jobTrackerApi.patch(detail.applicationId, { notes });
      onUpdated(next);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save notes");
    } finally {
      setNotesSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className={cn(appPanel, "space-y-2")}>
        <p className={appSectionLabel}>Application status</p>
        <div className="flex items-center gap-2">
          <AppSelect
            value={detail.status}
            onChange={(status) => changeStatus(status as JobTrackerStatus)}
            disabled={statusSaving}
            options={JOB_TRACKER_ACTIVE_STATUSES.map((status) => ({
              value: status,
              label: JOB_TRACKER_STATUS_LABELS[status],
            }))}
            className="h-11 w-full"
          />
          {statusSaving ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : null}
        </div>
      </div>

      <div className={cn(appPanel, "space-y-2")}>
        <div className="flex items-center justify-between gap-2">
          <p className={appSectionLabel}>Notes</p>
          {notesSaving ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving…
            </span>
          ) : null}
        </div>
        <RichTextEditor
          value={detail.notes ?? ""}
          onChange={(notes) => {
            if (notesTimerRef.current) window.clearTimeout(notesTimerRef.current);
            notesTimerRef.current = window.setTimeout(() => {
              void saveNotes(notes);
            }, 800);
          }}
          placeholder="Add notes, reminders, or contacts for this job"
          showAiRefine={false}
        />
      </div>
    </div>
  );
}
