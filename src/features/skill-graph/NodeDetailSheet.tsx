"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Quote } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Mono } from "@/components/marketing-2026/primitives";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { skillGraphApi, skillGraphKeys } from "./api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SkillEvidenceEvent } from "./types";
import { BAND_LABEL, ROUND_LABEL, STATUS_META, confidenceLabel, headline, pct } from "./view";
import type { SkillStatus } from "./types";

function ScoreBar({ value, tone }: { value: number; tone?: "gap" }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full bg-gradient-to-r", tone === "gap" ? "from-amber-500 to-amber-400" : "from-[#7367F0] to-[#1F8FFF]")}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: SkillStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.badge}>{meta.label}</Badge>;
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function EvidenceItem({ event }: { event: SkillEvidenceEvent }) {
  const kind =
    event.source === "report_metric"
      ? "From the interview report"
      : event.source === "resume"
        ? "Claimed on resume"
        : event.source === "manual"
          ? `Admin ${event.manual_action === "hide" ? "hid this skill" : event.manual_action === "unhide" ? "restored this skill" : "added this skill"}`
          : null;
  return (
    <li className="rounded-xl border border-border bg-background/60 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Mono className="text-[10.5px] text-primary">{(ROUND_LABEL[event.round] ?? event.round).toUpperCase()}</Mono>
        {event.level !== null && <Mono className="text-[10.5px] text-muted-foreground">LEVEL {event.level}/5</Mono>}
        <Mono className="text-[10.5px] text-muted-foreground">{day(event.created_at).toUpperCase()}</Mono>
        <span className="text-[12px] text-muted-foreground">{event.node_name}</span>
      </div>
      {event.quote_text && event.source === "grader" ? (
        <blockquote className="mt-2 flex gap-2 text-[13.5px] leading-relaxed text-foreground">
          <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span>“{event.quote_text}”</span>
        </blockquote>
      ) : (
        <p className="mt-2 text-[13px] text-muted-foreground">
          {kind}
          {event.quote_text ? ` — “${event.quote_text}”` : ""}
        </p>
      )}
      {event.interview_id && (
        <Mono className="mt-2 block truncate text-[10.5px] text-muted-foreground">INTERVIEW {event.interview_id}</Mono>
      )}
    </li>
  );
}

/** Detail panel: the node's numbers, its child skills and every evidence event with its verbatim quote. */
export function NodeDetailSheet({ candidateId, nodeId, onClose }: { candidateId: string; nodeId: string | null; onClose: () => void }) {
  const query = useQuery({
    queryKey: skillGraphKeys.node(candidateId, nodeId ?? ""),
    queryFn: () => skillGraphApi.getNode(candidateId, nodeId!),
    enabled: Boolean(nodeId),
  });
  const detail = query.data;
  const h = detail ? headline(detail.node) : null;

  return (
    <Sheet open={Boolean(nodeId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto lg:w-[min(560px,92vw)]">
        {!detail ? (
          <div className="flex flex-1 items-center justify-center p-10">
            {query.error ? <p className="text-sm text-destructive">{getApiErrorMessage(query.error, "Couldn't load this skill")}</p> : <Loader2 className="h-6 w-6 animate-spin text-primary" />}
          </div>
        ) : (
          <div className="space-y-6 p-6">
            <SheetHeader className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <StatusBadge status={detail.node.status} />
                <Mono className="text-[10.5px] text-muted-foreground">{detail.node.lens.replace("_", " ").toUpperCase()}</Mono>
              </div>
              <SheetTitle className="text-[22px] font-extrabold tracking-[-0.03em]">{detail.node.name}</SheetTitle>
              <SheetDescription>
                {confidenceLabel(detail.confidence)}
                {detail.node.is_main ? ` · coverage ${pct(detail.node.coverage ?? 0)}` : ""}
              </SheetDescription>
            </SheetHeader>

            {h?.kind === "score" && (
              <div>
                <Mono className="block text-[34px] leading-none tracking-tight">{h.value}</Mono>
                <div className="mt-3"><ScoreBar value={h.value} tone={detail.node.status === "gap" ? "gap" : undefined} /></div>
              </div>
            )}
            {h?.kind === "band" && <p className="text-[24px] font-extrabold tracking-[-0.03em]">{BAND_LABEL[h.value]}</p>}

            {detail.children.length > 0 && (
              <div>
                <Mono className="text-[11px] text-muted-foreground">SKILLS</Mono>
                <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
                  {detail.children.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="min-w-0 truncate text-[13px]">{c.name}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        {c.band ? (
                          <Mono className="text-[11px]">{BAND_LABEL[c.band].toUpperCase()}</Mono>
                        ) : c.score !== null ? (
                          <Mono className="text-[12px]">{c.score}</Mono>
                        ) : null}
                        <StatusBadge status={c.status} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <Mono className="text-[11px] text-muted-foreground">EVIDENCE ({detail.events.length})</Mono>
              {detail.events.length === 0 ? (
                <p className="mt-2 text-[13px] text-muted-foreground">No evidence yet. Practise an interview, coding or system design round that touches this skill.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {detail.events.map((e) => (
                    <EvidenceItem key={e.event_id} event={e} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
