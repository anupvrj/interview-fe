"use client";

import "./skill-graph.css";
import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Download, Loader2, Quote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Mono } from "@/components/marketing-2026/primitives";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import { skillGraphApi, skillGraphKeys } from "./api";
import { NodeDetailSheet } from "./NodeDetailSheet";
import { SkillGraphCanvas, STATUS_STYLE, scoreText } from "./SkillGraphCanvas";
import { GRAPH_TABS, countStatuses, layoutGraph, type GraphTab } from "./layout";
import type { SkillGraph } from "./types";
import { ROUND_LABEL, confidenceLabel, pct } from "./view";

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function downloadJson(data: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The selected skill: state, score, the latest verbatim quote, and a way into all its evidence. */
function FocusCard({ candidateId, nodeId, graph, onOpenEvidence }: { candidateId: string; nodeId: string | null; graph: SkillGraph; onOpenEvidence: () => void }) {
  const debounced = useDebounced(nodeId, 220);
  const node = graph.nodes.find((n) => n.id === nodeId) ?? null;
  const group = node ? graph.nodes.find((n) => n.id === node.domain) : null;
  const detail = useQuery({
    queryKey: skillGraphKeys.node(candidateId, debounced ?? ""),
    queryFn: () => skillGraphApi.getNode(candidateId, debounced!),
    enabled: Boolean(debounced),
    staleTime: 60_000,
  });
  if (!node) {
    return <div className="rounded-[22px] border border-border bg-card p-5 text-[13.5px] text-muted-foreground">Hover or tap a skill.</div>;
  }
  const st = STATUS_STYLE[node.status] ?? STATUS_STYLE.unassessed;
  const shownScore = detail.data?.node.id === node.id ? scoreText(detail.data.node) : scoreText(node);
  const quote = detail.data?.node.id === node.id ? detail.data.events.find((e) => e.source === "grader" && e.quote_text) : undefined;
  const evidence = detail.data?.node.id === node.id ? detail.data.events.length : node.evidence_count;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={node.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-[22px] border border-border bg-card p-5 text-card-foreground"
      >
        <div className="flex items-center justify-between gap-3">
          <Mono className="truncate text-[11px] text-muted-foreground">{(node.is_main ? "AREA" : group?.name ?? "").toUpperCase()}</Mono>
          <span className="sg-root inline-flex shrink-0 items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-[11.5px]">
            <span className="size-2 rounded-full" style={{ background: st.color }} />
            {st.label}
          </span>
        </div>
        <p className="mt-2 text-[22px] font-bold leading-tight tracking-tight">{node.name}</p>
        {shownScore ? (
          <Mono className="mt-1 block text-[34px] leading-none">
            {shownScore}
            {!node.band && <span className="text-[14px] text-muted-foreground">/100</span>}
          </Mono>
        ) : (
          <p className="mt-1 text-[14px] text-muted-foreground">{node.status === "claimed" ? "On your resume. Practise a round to prove it." : node.is_main ? "No score yet." : "Rolls up into its area."}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
          <span>{confidenceLabel(node.confidence)}</span>
          {node.is_main && <span>Coverage {pct(node.coverage ?? 0)}</span>}
        </div>
        {quote && (
          <blockquote className="mt-3 flex gap-2 border-t border-border pt-3 text-[13.5px] leading-relaxed">
            <Quote className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            <span>
              “{quote.quote_text}”
              <Mono className="mt-1 block text-[10.5px] text-muted-foreground">{(ROUND_LABEL[quote.round] ?? quote.round).toUpperCase()} · LEVEL {quote.level}/5</Mono>
            </span>
          </blockquote>
        )}
        <button type="button" onClick={onOpenEvidence} className="mt-4 block w-full border-t border-border pt-3 text-left">
          <Mono className="text-[11px] text-muted-foreground hover:text-primary">
            {evidence > 0 ? `BACKED BY ${evidence} PIECE${evidence === 1 ? "" : "S"} OF EVIDENCE →` : "NO EVIDENCE YET"}
          </Mono>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Full Skill Graph explorer: Overall / Technical / Communication / Behavioural tabs,
 * the interactive radial graph, the focused skill, a session scrubber and JSON export.
 */
export function SkillGraphExplorer({ candidateId, actions, emptyState }: { candidateId: string; actions?: React.ReactNode; emptyState?: React.ReactNode }) {
  const [tab, setTab] = useState<GraphTab>("technical");
  const [folded, setFolded] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [sheetNode, setSheetNode] = useState<string | null>(null);
  const [step, setStep] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const live = useQuery({ queryKey: skillGraphKeys.graph(candidateId), queryFn: () => skillGraphApi.getGraph(candidateId) });
  const sessions = useMemo(() => [...(live.data?.interviews ?? [])].sort((a, b) => +new Date(a.analyzed_at) - +new Date(b.analyzed_at)), [live.data]);
  const asOf = step !== null && step < sessions.length ? sessions[step - 1]?.interview_id ?? null : null;
  const replay = useQuery({
    queryKey: skillGraphKeys.graph(candidateId, asOf),
    queryFn: () => skillGraphApi.getGraph(candidateId, { asOf }),
    enabled: Boolean(asOf),
    placeholderData: keepPreviousData,
  });
  const graph = asOf ? replay.data ?? live.data : live.data;
  const layout = useMemo(() => layoutGraph(graph?.nodes ?? [], tab, { folded }), [graph, tab, folded]);
  const singleDomain = tab === "communication" || tab === "behavioural";
  // Legend counts always include untested skills, even when the canvas hides them.
  const counts = countStatuses(layout.nodes, tab);
  const groupIds = layout.nodes.filter((n) => n.depth === 1 && (n.childCount ?? 0) > 0).map((n) => n.node.id);
  const gathered = groupIds.length > 0 && groupIds.every((id) => folded.has(id));
  const toggleGroup = (id: string) =>
    setFolded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // YOU: fold every area in, or bloom them all back out.
  const toggleCore = () => setFolded(gathered ? new Set() : new Set(groupIds));

  useEffect(() => setFolded(new Set()), [tab]);

  // Keep a sensible selection as tabs change: the weakest scored node, else the first.
  useEffect(() => {
    if (selected && layout.nodes.some((n) => n.node.id === selected)) return;
    const scored = layout.nodes.filter((n) => n.node.score !== null || n.node.band !== null);
    const pick = scored.sort((a, b) => (a.node.score ?? 50) - (b.node.score ?? 50))[0] ?? layout.nodes.find((n) => n.depth === 1);
    setSelected(pick?.node.id ?? null);
  }, [layout, selected]);

  const exportJson = async () => {
    setExporting(true);
    try {
      const data = await skillGraphApi.exportGraph(candidateId);
      downloadJson(data, `interviewtrix-skill-graph-${new Date().toISOString().slice(0, 10)}.json`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't export the skill graph"));
    } finally {
      setExporting(false);
    }
  };

  if (!live.data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        {live.error ? <p className="text-sm text-destructive">{getApiErrorMessage(live.error, "Couldn't load the skill graph")}</p> : <Loader2 className="h-7 w-7 animate-spin text-primary" />}
      </div>
    );
  }
  if (live.data.nodes.length === 0 && emptyState) return <>{emptyState}</>;

  const sliderValue = step ?? sessions.length;
  const domain = layout.domain;
  const domainScore = domain ? scoreText(domain) : null;

  return (
    <div className="sg-root space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="tablist" aria-label="Skill group" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          <div className="inline-flex shrink-0 rounded-xl border border-border bg-muted/50 p-1">
            {GRAPH_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={tab === t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition-colors sm:px-4 sm:text-[13.5px]",
                  tab === t.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {actions}
          <Button type="button" variant="outline" disabled={exporting} onClick={exportJson} className="h-10 rounded-xl">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export JSON
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative overflow-hidden rounded-[26px] border shadow-[0_40px_80px_-50px_rgba(10,22,40,.55)]" style={{ background: "var(--sg-canvas)", borderColor: "var(--sg-border)" }}>
          <div className="sg-dots pointer-events-none absolute inset-0" />
          <div className="relative flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
            <Mono className="text-[11px]" style={{ color: "var(--sg-muted)" }}>
              {singleDomain && domain
                ? `${domain.name.toUpperCase()}${domainScore ? ` · ${domainScore.toUpperCase()}` : ""}`
                : `${layout.nodes.filter((n) => n.depth === 1).length} AREAS · ${counts.verified + counts.gap} SKILLS TESTED`}
            </Mono>
            {!singleDomain && groupIds.length > 0 && (
              <>
                <Mono className="text-[10.5px] max-lg:hidden" style={{ color: "var(--sg-muted)" }}>CLICK AN AREA TO FOLD · DRAG TO MOVE · PINCH OR CTRL+SCROLL TO ZOOM</Mono>
                <Mono className="text-[10.5px] lg:hidden" style={{ color: "var(--sg-muted)" }}>TWO FINGERS TO ZOOM & MOVE</Mono>
              </>
            )}
          </div>
          <div className="relative mx-auto w-full max-w-[min(100%,80vh)] px-1">
            {layout.nodes.length === 0 ? (
              <p className="py-24 text-center text-[13.5px]" style={{ color: "var(--sg-muted)" }}>Nothing here yet.</p>
            ) : (
              <SkillGraphCanvas
                layout={layout}
                selected={selected}
                onSelect={setSelected}
                onToggleGroup={toggleGroup}
                onCore={toggleCore}
                gathered={gathered}
                groupDepth={singleDomain ? 0 : 1}
                resetKey={tab}
              />
            )}
          </div>

          {sessions.length > 0 && (
            <div className="relative flex items-center gap-4 border-t px-5 py-4" style={{ borderColor: "var(--sg-border)" }}>
              <Mono className="shrink-0 text-[11px]" style={{ color: "var(--sg-muted)" }}>SESSION</Mono>
              <input
                type="range"
                min={1}
                max={sessions.length}
                value={sliderValue}
                onChange={(e) => setStep(Number(e.target.value))}
                aria-label="Show the graph after session"
                className="h-1 w-full cursor-pointer accent-[#9B8CFF]"
              />
              <Mono className="w-28 shrink-0 text-right text-[12px]" style={{ color: "var(--sg-text)" }}>
                {replay.isFetching && asOf ? "…" : `S${sliderValue} / ${sessions.length}`}
                <span className="block text-[10px]" style={{ color: "var(--sg-muted)" }}>
                  {(ROUND_LABEL[sessions[sliderValue - 1]?.round] ?? "").toUpperCase()}
                </span>
              </Mono>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <FocusCard candidateId={candidateId} nodeId={selected} graph={graph!} onOpenEvidence={() => selected && setSheetNode(selected)} />
          <div className="grid grid-cols-3 gap-3">
            {(["verified", "gap", "claimed"] as const).map((k) => (
              <div key={k} className="rounded-2xl border border-border bg-card p-3.5">
                <span className="block size-3 rounded-full border-2" style={{ borderColor: STATUS_STYLE[k].color, borderStyle: STATUS_STYLE[k].dash ? "dashed" : "solid" }} />
                <Mono className="mt-2 block text-[22px] leading-none">{counts[k]}</Mono>
                <span className="mt-1 block text-[12px] text-muted-foreground">{STATUS_STYLE[k].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phones: labels are hidden on the canvas, so list the skills as chips. */}
        <div className="space-y-3 rounded-[22px] border px-4 py-4 sm:hidden" style={{ background: "var(--sg-canvas)", borderColor: "var(--sg-border)" }}>
          {(singleDomain ? [{ id: "all", name: domain?.name ?? "", members: layout.nodes }] : layout.nodes.filter((n) => n.depth === 1).map((g) => ({ id: g.node.id, name: g.node.name, members: layout.nodes.filter((n) => n.groupId === g.node.id && n.depth > 1) }))).map((g) =>
            g.members.length === 0 ? null : (
              <div key={g.id}>
                <Mono className="text-[10.5px]" style={{ color: "var(--sg-muted)" }}>{g.name.toUpperCase()}</Mono>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {g.members.map((n) => (
                    <button
                      key={n.node.id}
                      type="button"
                      onClick={() => setSelected(n.node.id)}
                      aria-pressed={selected === n.node.id}
                      className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[12px]"
                      style={{ borderColor: selected === n.node.id ? "var(--sg-line-strong)" : "var(--sg-border)", color: selected === n.node.id ? "var(--sg-text)" : "var(--sg-muted)" }}
                    >
                      <span className="size-2 rounded-full" style={{ background: (STATUS_STYLE[n.node.status] ?? STATUS_STYLE.unassessed).color }} />
                      {n.node.name}
                    </button>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>

      </div>

      <NodeDetailSheet candidateId={candidateId} nodeId={sheetNode} onClose={() => setSheetNode(null)} />
    </div>
  );
}
