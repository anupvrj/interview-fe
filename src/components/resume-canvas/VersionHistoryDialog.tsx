"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, History, Loader2, RotateCcw } from "lucide-react";
import { Resume, ResumeTemplate, resumeApi } from "@/lib/api";
import { PaginatedPreview } from "@/components/PaginatedPreview";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CanvasEditProvider } from "./CanvasEditContext";

type VersionRow = { versionId: string; title: string; templateId: string; createdAt: string };

function dayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

/** Full-screen version history: pick a saved version, preview it, restore it or copy it. */
export function VersionHistoryDialog({
  open,
  onOpenChange,
  resume,
  template,
  onRestored,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resume: Resume;
  template: ResumeTemplate;
  /** In-place restore → the restored resume; copy → navigate to the new one. */
  onRestored: (restored: Resume, asCopy: boolean) => void;
}) {
  const [versions, setVersions] = useState<VersionRow[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Awaited<ReturnType<typeof resumeApi.getVersion>> | null>(null);
  const [busy, setBusy] = useState<"restore" | "copy" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setVersions(null);
    setSelected(null);
    setError(null);
    resumeApi
      .listVersions(resume.resumeId)
      .then((rows) => {
        setVersions(rows);
        setSelectedId(rows[0]?.versionId ?? null);
      })
      .catch(() => setError("Couldn't load the history."));
  }, [open, resume.resumeId]);

  useEffect(() => {
    if (!open || !selectedId) return;
    setSelected(null);
    resumeApi
      .getVersion(resume.resumeId, selectedId)
      .then(setSelected)
      .catch(() => setError("Couldn't load that version."));
  }, [open, selectedId, resume.resumeId]);

  const groups = useMemo(() => {
    const map = new Map<string, VersionRow[]>();
    for (const v of versions ?? []) {
      const label = dayLabel(new Date(v.createdAt));
      map.set(label, [...(map.get(label) ?? []), v]);
    }
    return [...map.entries()];
  }, [versions]);

  const previewResume = useMemo<Resume | null>(
    () =>
      selected
        ? ({
            ...resume,
            content: selected.content,
            profileSummary: selected.profileSummary,
            sectionOrder: selected.sectionOrder,
            layout: selected.layout ?? resume.layout,
          } as Resume)
        : null,
    [selected, resume],
  );

  const restore = async (asCopy: boolean) => {
    if (!selectedId) return;
    setBusy(asCopy ? "copy" : "restore");
    setError(null);
    try {
      const restored = await resumeApi.restoreVersion(resume.resumeId, selectedId, asCopy);
      onRestored(restored, asCopy);
      onOpenChange(false);
    } catch {
      setError("Restore failed. Your resume was not changed.");
    } finally {
      setBusy(null);
    }
  };

  const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 [&>button]:hidden">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-background px-3 py-2 md:px-4">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)} aria-label="Back to editor">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4 text-primary" />
            Version history
          </DialogTitle>
          <div className="ml-auto flex gap-2">
            <Button type="button" size="sm" variant="outline" disabled={!selectedId || busy !== null} onClick={() => void restore(true)}>
              {busy === "copy" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              Restore as a copy
            </Button>
            <Button type="button" size="sm" disabled={!selectedId || busy !== null} onClick={() => void restore(false)}>
              {busy === "restore" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-1.5 h-3.5 w-3.5" />}
              Restore this version
            </Button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="max-h-48 shrink-0 overflow-y-auto border-b border-border bg-muted/30 md:max-h-none md:w-64 md:border-b-0 md:border-r">
            {error ? <p className="p-4 text-sm text-red-600">{error}</p> : null}
            {versions === null && !error ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : null}
            {versions && versions.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No earlier versions yet. A version is saved every 10 minutes while you edit.
              </p>
            ) : null}
            {groups.map(([label, rows]) => (
              <div key={label}>
                <p className="px-4 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {label} · {rows.length} {rows.length === 1 ? "version" : "versions"}
                </p>
                {rows.map((v) => (
                  <button
                    key={v.versionId}
                    type="button"
                    onClick={() => setSelectedId(v.versionId)}
                    className={cn(
                      "flex w-full items-center gap-2 px-4 py-2 text-left text-sm",
                      selectedId === v.versionId ? "bg-primary/10 font-semibold text-primary" : "text-foreground hover:bg-muted",
                    )}
                  >
                    {time(v.createdAt)}
                    {v.templateId && v.templateId !== resume.templateId ? (
                      <span className="truncate text-[11px] font-normal text-muted-foreground">· {v.templateId}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            ))}
          </aside>
          <div className="min-h-0 flex-1 overflow-auto bg-zinc-800/90 p-4 md:p-8">
            {previewResume ? (
              <div className="mx-auto w-fit [zoom:0.45] sm:[zoom:0.6] lg:[zoom:0.75] xl:[zoom:0.9]">
                <CanvasEditProvider value={null}>
                  <PaginatedPreview
                    key={selectedId ?? "none"}
                    resume={previewResume}
                    template={template}
                    sections={previewResume.sectionOrder ?? undefined}
                    layout={previewResume.layout}
                  />
                </CanvasEditProvider>
              </div>
            ) : selectedId ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
