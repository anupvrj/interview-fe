"use client";

import {
  LAB_CATEGORIES,
  classifyPrompt,
  getKindLabel,
  groupPromptsByCategory,
  type PromptCategoryId,
} from "@/lib/labPromptCatalog";
import type { PromptRecord } from "@/lib/runtimeApi";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Code2,
  FileText,
  Layers,
  MessageSquare,
  Mic,
  Network,
} from "lucide-react";
import { useMemo, useState } from "react";

const ICONS = {
  mic: Mic,
  code: Code2,
  layers: Layers,
  "bar-chart": BarChart3,
  "file-text": FileText,
  briefcase: Briefcase,
  network: Network,
  message: MessageSquare,
} as const;

const KIND_BADGE: Record<string, string> = {
  voice: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  execute: "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  profile: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
};

type Props = {
  prompts: PromptRecord[];
  selectedName: string;
  onSelect: (prompt: PromptRecord) => void;
};

export function LabPromptSidebar({ prompts, selectedName, onSelect }: Props) {
  const groups = useMemo(() => groupPromptsByCategory(prompts), [prompts]);
  const [expanded, setExpanded] = useState<Set<PromptCategoryId>>(
    () => new Set(LAB_CATEGORIES.map((c) => c.id)),
  );

  const toggle = (id: PromptCategoryId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <nav className="flex flex-col gap-1">
      {LAB_CATEGORIES.map((cat) => {
        const items = groups.get(cat.id) ?? [];
        if (items.length === 0) return null;
        const Icon = ICONS[cat.icon];
        const isOpen = expanded.has(cat.id);

        return (
          <div key={cat.id} className="rounded-lg border border-border/60 bg-card/50">
            <button
              type="button"
              onClick={() => toggle(cat.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-muted/50"
            >
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{cat.label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {items.length}
              </span>
            </button>
            {isOpen ? (
              <ul className="space-y-0.5 px-2 pb-2">
                {items.map((p) => {
                  const meta = classifyPrompt(p);
                  const active = p.name === selectedName;
                  return (
                    <li key={p.name}>
                      <button
                        type="button"
                        onClick={() => onSelect(p)}
                        className={cn(
                          "w-full rounded-md px-2 py-1.5 text-left transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted/80",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate text-xs font-medium leading-snug">
                            {p.name.startsWith("profile-")
                              ? p.name.replace("profile-", "")
                              : p.name}
                          </span>
                          {!active ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0 px-1 py-0 text-[10px] font-normal",
                                KIND_BADGE[meta.kind],
                              )}
                            >
                              {getKindLabel(meta.kind)}
                            </Badge>
                          ) : null}
                        </div>
                        {active ? (
                          <p className="mt-0.5 text-[10px] opacity-80 line-clamp-2">
                            {meta.description}
                          </p>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
