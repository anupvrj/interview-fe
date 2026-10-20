"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ShareLinkDialog({ url, onOpenChange }: { url: string | null; onOpenChange: (open: boolean) => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the field is selectable as a fallback */
    }
  };
  return (
    <Dialog
      open={url !== null}
      onOpenChange={(open) => {
        if (!open) setCopied(false);
        onOpenChange(open);
      }}
    >
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>Share your resume</DialogTitle>
          <DialogDescription>Anyone with this link can view the PDF for the next 7 days.</DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex gap-2">
          <input
            readOnly
            value={url ?? ""}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground"
            aria-label="Share link"
          />
          <Button type="button" size="sm" onClick={() => void copy()} className="shrink-0">
            {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Open the PDF <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
