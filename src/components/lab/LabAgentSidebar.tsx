"use client";

import {
  AGENT_TYPE_GROUPS,
  classifyPrompt,
  getAgentDisplayName,
  getAgentInitials,
  getKindLabel,
  groupAgentsByKind,
} from "@/lib/labPromptCatalog";
import type { PromptRecord } from "@/lib/runtimeApi";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

const KIND_ACCENT: Record<string, string> = {
  voice: "bg-sky-500",
  execute: "bg-violet-500",
  profile: "bg-amber-500",
};

const KIND_BADGE: Record<string, string> = {
  voice: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  execute: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  profile: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
};

type Props = {
  prompts: PromptRecord[];
  selectedName: string;
  onSelect: (prompt: PromptRecord) => void;
};

export function LabAgentSidebar({ prompts, selectedName, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => groupAgentsByKind(prompts), [prompts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    const next = new Map(groups);
    for (const [kind, items] of next) {
      next.set(
        kind,
        items.filter((p) => {
          const meta = classifyPrompt(p);
          const label = getAgentDisplayName(p.name, meta);
          return (
            label.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            meta.categoryLabel.toLowerCase().includes(q)
          );
        }),
      );
    }
    return next;
  }, [groups, query]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 px-3 py-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          My agents
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents…"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {AGENT_TYPE_GROUPS.map((group) => {
          const items = filtered.get(group.kind) ?? [];
          if (items.length === 0) return null;

          return (
            <div key={group.kind} className="mb-4">
              <div className="mb-1 px-2">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {group.label}
                </p>
              </div>
              <ul className="space-y-0.5">
                {items.map((p) => {
                  const meta = classifyPrompt(p);
                  const displayName = getAgentDisplayName(p.name, meta);
                  const active = p.name === selectedName;
                  return (
                    <li key={p.name}>
                      <button
                        type="button"
                        onClick={() => onSelect(p)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
                          active
                            ? "bg-primary/10 ring-1 ring-primary/20"
                            : "hover:bg-muted/60",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white",
                            KIND_ACCENT[meta.kind],
                          )}
                        >
                          {getAgentInitials(displayName)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium leading-tight">
                            {displayName}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-1 py-0 text-[9px] font-normal",
                                KIND_BADGE[meta.kind],
                              )}
                            >
                              {getKindLabel(meta.kind)}
                            </Badge>
                            {!active ? (
                              <span className="truncate text-[10px] text-muted-foreground">
                                {meta.categoryLabel}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
