"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** Download with a chosen file name, as PDF or as plain text (the text an ATS reads). */
export function DownloadDialog({
  open,
  onOpenChange,
  defaultName,
  downloadingPdf,
  onPdf,
  onTxt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Without extension. */
  defaultName: string;
  downloadingPdf: boolean;
  onPdf: (name: string) => void;
  onTxt: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(defaultName);
  const [txtBusy, setTxtBusy] = useState(false);
  useEffect(() => {
    if (open) setName(defaultName);
  }, [open, defaultName]);
  const clean = name.replace(/\.(pdf|txt)$/i, "").trim() || defaultName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>Download your resume</DialogTitle>
          <DialogDescription>Pick a file name recruiters will recognise, like “Priya_Raghavan_Backend_Engineer”.</DialogDescription>
        </DialogHeader>
        <label className="mt-1 block text-xs font-semibold text-muted-foreground" htmlFor="resume-file-name">
          File name
        </label>
        <div className="flex items-center gap-1.5">
          <input
            id="resume-file-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <span className="text-sm text-muted-foreground">.pdf</span>
        </div>
        <p className="text-[11px] text-muted-foreground">Letters, numbers and spaces work best; other characters are removed.</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Button type="button" className="flex-1" disabled={downloadingPdf} onClick={() => onPdf(clean)}>
            {downloadingPdf ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
            Download PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={txtBusy}
            onClick={async () => {
              setTxtBusy(true);
              try {
                await onTxt(clean);
              } finally {
                setTxtBusy(false);
              }
            }}
          >
            {txtBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileText className="mr-1.5 h-4 w-4" />}
            Download as TXT
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">TXT is handy for pasting into online application forms.</p>
      </DialogContent>
    </Dialog>
  );
}
