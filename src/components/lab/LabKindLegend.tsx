"use client";

import { getKindDescription, getKindLabel, type PromptKind } from "@/lib/labPromptCatalog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const KINDS: PromptKind[] = ["voice", "execute", "profile"];

const KIND_BADGE: Record<PromptKind, string> = {
  voice: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  execute: "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  profile: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
};

export function LabKindLegend() {
  return (
    <div className="flex flex-wrap gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
      {KINDS.map((kind) => (
        <div key={kind} className="flex min-w-[10rem] flex-1 items-start gap-2">
          <Badge
            variant="outline"
            className={cn("shrink-0 text-[10px]", KIND_BADGE[kind])}
          >
            {getKindLabel(kind)}
          </Badge>
          <p className="text-[11px] leading-snug text-muted-foreground">
            {getKindDescription(kind)}
          </p>
        </div>
      ))}
    </div>
  );
}
