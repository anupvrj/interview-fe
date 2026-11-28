"use client";

import { useState } from "react";
import { Copy, Download, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { resumeApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const TONES = ["Warm and direct", "Formal", "Short and punchy"];

/** A cover letter from this resume (and the job post): facts only, editable, copy or download. */
export function CoverLetterDialog({
  open,
  onOpenChange,
  resumeText,
  name,
  defaultJobDescription,
  defaultRole,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeText: string;
  name?: string;
  defaultJobDescription?: string;
  defaultRole?: string;
}) {
  const [jd, setJd] = useState(defaultJobDescription ?? "");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState(defaultRole ?? "");
  const [tone, setTone] = useState(TONES[0]);
  const [state, setState] = useState<{ loading: boolean; text?: string; dropped?: number; error?: string }>({ loading: false });
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setState({ loading: true });
    try {
      const r = await resumeApi.aiCoverLetter({ resumeText, name, jobDescription: jd.trim() || undefined, company: company.trim() || undefined, role: role.trim() || undefined, tone });
      setState({ loading: false, text: r.text, dropped: r.dropped });
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setState({ loading: false, error: msg ?? "Couldn't write the cover letter right now. Try again." });
    }
  };

  const download = async (kind: "docx" | "txt") => {
    const text = state.text ?? "";
    const base = `${(name || "Cover letter").replace(/[^\w\s-]/g, "").trim()}${company ? ` - ${company}` : ""} - Cover letter`;
    let blob: Blob;
    if (kind === "txt") blob = new Blob([text], { type: "text/plain" });
    else {
      const { Document, Packer, Paragraph, TextRun } = await import("docx");
      blob = await Packer.toBlob(
        new Document({
          sections: [{ properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } }, children: text.split(/\n{2,}/).map((p) => new Paragraph({ spacing: { after: 200 }, children: p.split("\n").flatMap((line, i) => [new TextRun({ text: line, break: i ? 1 : 0, font: "Calibri", size: 22 })]) })) }],
        }),
      );
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto" data-testid="cover-letter">
        <DialogHeader>
          <DialogTitle>Cover letter</DialogTitle>
          <DialogDescription>Written from your resume — only your real experience and numbers. Add the job post for a letter aimed at that role.</DialogDescription>
        </DialogHeader>
        {!state.text ? (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <input aria-label="Company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (optional)" className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground" />
              <input aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (optional)" className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground" />
            </div>
            <textarea aria-label="Job post" value={jd} onChange={(e) => setJd(e.target.value)} rows={6} placeholder="Paste the job post (optional, recommended)" className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm text-foreground" />
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((t) => (
                <button key={t} type="button" aria-pressed={tone === t} onClick={() => setTone(t)} className={cn("rounded-full border px-3 py-1 text-xs font-medium", tone === t ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary/60")}>
                  {t}
                </button>
              ))}
            </div>
            {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
            <div className="flex justify-end">
              <Button onClick={() => void run()} disabled={state.loading}>
                {state.loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />} Write my cover letter
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea aria-label="Cover letter" value={state.text} onChange={(e) => setState((s) => ({ ...s, text: e.target.value }))} rows={16} className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm leading-relaxed text-foreground" data-testid="cover-letter-text" />
            {state.dropped ? <p className="text-[11px] text-muted-foreground">Left out {state.dropped} sentence{state.dropped === 1 ? "" : "s"} that added things not on your resume.</p> : null}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={() => setState({ loading: false })}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> Start over
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard?.writeText(state.text ?? "");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                <Copy className="mr-1.5 h-4 w-4" /> {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline" onClick={() => void download("txt")}>
                .txt
              </Button>
              <Button onClick={() => void download("docx")}>
                <Download className="mr-1.5 h-4 w-4" /> Word
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
