"use client";

import { Loader2, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PREVIEW_VIEWPORTS,
  type PreviewViewport,
} from "@/lib/notifications/email-theme";

interface EmailPreviewFrameProps {
  html: string;
  subject?: string;
  viewport: PreviewViewport;
  onViewportChange: (v: PreviewViewport) => void;
  loading?: boolean;
  className?: string;
}

export function EmailPreviewFrame({
  html,
  subject,
  viewport,
  onViewportChange,
  loading,
  className,
}: EmailPreviewFrameProps) {
  const frameWidth = PREVIEW_VIEWPORTS[viewport].width;

  return (
    <div className={cn("flex h-full flex-col overflow-hidden rounded-lg border border-border/60", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">Live preview</p>
          {subject ? (
            <p className="truncate text-sm font-medium text-foreground" title={subject}>
              Subject: {subject}
            </p>
          ) : null}
        </div>
        <div className="flex gap-1 rounded-lg border border-border/60 bg-background p-0.5">
          {(Object.keys(PREVIEW_VIEWPORTS) as PreviewViewport[]).map((key) => {
            const Icon = key === "desktop" ? Monitor : Smartphone;
            const active = viewport === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onViewportChange(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-[#7367F0]/10 text-[#7367F0]"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {PREVIEW_VIEWPORTS[key].label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative flex flex-1 items-start justify-center overflow-auto bg-[#e8e6ef] p-4">
        {loading ? (
          <div className="flex h-full min-h-[420px] w-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
          </div>
        ) : (
          <div
            className="shrink-0 overflow-hidden rounded-xl border border-border/60 bg-white shadow-lg transition-[width] duration-200"
            style={{ width: frameWidth, maxWidth: "100%" }}
          >
            <iframe
              title="Email preview"
              srcDoc={html}
              className="block w-full bg-white"
              style={{ height: 520, border: 0 }}
              sandbox=""
            />
          </div>
        )}
      </div>
    </div>
  );
}
