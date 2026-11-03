"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi, type AdminResumeTemplateDesign } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";

type Tab = "style" | "structure" | "css" | "json";
const TABS: { id: Tab; label: string }[] = [
  { id: "style", label: "Style" },
  { id: "structure", label: "Structure" },
  { id: "css", label: "CSS" },
  { id: "json", label: "JSON" },
];

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : {});

/** "border-bottom" / "borderBottom" → "Border bottom". */
function humanize(key: string): string {
  const words = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function show(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(show).join(", ");
  return Object.entries(rec(value))
    .map(([k, v]) => `${humanize(k)} ${show(v)}`)
    .join(" · ");
}

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="rounded-xl border border-border p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Fields({ value, skip = [] }: Readonly<{ value: unknown; skip?: string[] }>) {
  const entries = Object.entries(rec(value)).filter(([k]) => !skip.includes(k));
  if (!entries.length) return <p className="text-sm text-muted-foreground">Not set</p>;
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex min-w-0 justify-between gap-3 border-b border-border/60 pb-1.5">
          <dt className="shrink-0 text-muted-foreground">{humanize(k)}</dt>
          <dd className="min-w-0 truncate text-right font-medium text-foreground" title={show(v)}>
            {show(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Swatches({ colors }: Readonly<{ colors: Rec }>) {
  const entries = Object.entries(colors).filter(([, v]) => typeof v === "string" && v);
  if (!entries.length) return <p className="text-sm text-muted-foreground">Not set</p>;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2">
          <span className="h-6 w-6 shrink-0 rounded-md border border-border/80" style={{ background: String(v) }} />
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">{humanize(k)}</p>
            <p className="font-mono text-xs text-foreground">{String(v)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CodeBlock({ text, label }: Readonly<{ text: string; label: string }>) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
          {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="max-h-[50vh] overflow-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-[12px] leading-relaxed text-foreground">
        {text || "—"}
      </pre>
    </div>
  );
}

function StyleTab({ design }: Readonly<{ design: AdminResumeTemplateDesign }>) {
  const style = rec(design.config.style);
  const base = rec(design.config.template);
  const fontFamily = String(style.fontFamily ?? rec(base.layout).fontFamily ?? "");
  return (
    <div className="space-y-4">
      <Section title="Typography">
        {fontFamily ? (
          <p className="mb-3 text-xl text-foreground" style={{ fontFamily }}>
            {design.name} — The quick brown fox
          </p>
        ) : null}
        <Fields value={{ fontFamily, fontSize: style.fontSize, lineHeight: style.lineHeight }} />
      </Section>
      <Section title="Colours">
        <Swatches colors={rec(style.colors ?? base.colors)} />
      </Section>
      <Section title="Page">
        <Fields value={{ headerStyle: style.headerStyle, sectionSpacing: style.sectionSpacing, padding: style.padding, headerLayout: style.headerLayout }} />
      </Section>
      <Section title="Section headers">
        <Fields value={style.sectionHeader} />
      </Section>
      <Section title="Content blocks">
        <Fields
          value={{
            skills: style.skillsDisplay,
            timeline: style.timelineLayout,
            contact: style.contactDisplay,
            languages: style.languageDisplay,
          }}
        />
      </Section>
    </div>
  );
}

function StructureTab({ design }: Readonly<{ design: AdminResumeTemplateDesign }>) {
  const rendering = rec(design.config.structure.rendering);
  const layout = rec(rendering.layout);
  const widths = rec(layout.columnWidths);
  const assignment = rec(layout.columnAssignment);
  const type = String(layout.type ?? "single");
  const left = typeof widths.left === "number" ? widths.left : null;
  const right = typeof widths.right === "number" ? widths.right : null;
  const twoColumns = type !== "single" && left !== null && right !== null && right > 0;
  const columnLists = ["left", "right"].map((side) => ({
    side,
    sections: Array.isArray(assignment[side]) ? (assignment[side] as unknown[]).map(String) : [],
  }));
  return (
    <div className="space-y-4">
      <Section title="Layout">
        <p className="text-sm font-medium text-foreground">
          {twoColumns ? `Two columns · ${left}% / ${right}%` : type === "header-plus-columns" ? "Header plus columns" : "Single column"}
        </p>
        <div className="mt-3 flex h-16 gap-1.5 rounded-lg border border-border bg-muted/30 p-1.5" aria-hidden>
          {twoColumns ? (
            <>
              <div className="rounded-md bg-primary/25" style={{ width: `${left}%` }} />
              <div className="rounded-md bg-primary/10" style={{ width: `${right}%` }} />
            </>
          ) : (
            <div className="w-full rounded-md bg-primary/15" />
          )}
        </div>
        {columnLists.some((c) => c.sections.length) ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {columnLists.map((c) => (
              <div key={c.side}>
                <p className="text-xs text-muted-foreground">{humanize(c.side)} column</p>
                <p className="mt-1 text-sm text-foreground">{c.sections.length ? c.sections.map(humanize).join(", ") : "—"}</p>
              </div>
            ))}
          </div>
        ) : null}
      </Section>
      <Section title="Sections, in order">
        <div className="flex flex-wrap gap-1.5">
          {design.config.structure.sections.map((s, i) => (
            <span key={s} className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground">
              <span className="mr-1 tabular-nums text-muted-foreground">{i + 1}</span>
              {humanize(s)}
            </span>
          ))}
        </div>
      </Section>
      <Section title="Rendering">
        <Fields value={{ dataStructure: rendering.dataStructure, pageBreak: rendering.pageBreak, features: rendering.features }} />
      </Section>
    </div>
  );
}

/** Read-only view of a template's stored design (the `resume_templates` record). */
export function ResumeTemplateDesignDialog({
  templateId,
  onOpenChange,
}: Readonly<{ templateId: string | null; onOpenChange: (open: boolean) => void }>) {
  const [design, setDesign] = useState<AdminResumeTemplateDesign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("style");

  useEffect(() => {
    if (!templateId) return;
    let cancelled = false;
    setDesign(null);
    setError(null);
    setTab("style");
    adminApi
      .getResumeTemplateDesign(templateId)
      .then((d) => {
        if (!cancelled) setDesign(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(e, "Failed to load the template design"));
      });
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  const synced = design?.syncedAt ? new Date(design.syncedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : null;

  return (
    <Dialog open={templateId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 py-4 text-left sm:px-6">
          <DialogTitle>{design?.name ?? "Template design"}</DialogTitle>
          <DialogDescription className="font-mono text-xs">{templateId}</DialogDescription>
          {design ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              {design.stored ? <Badge variant="success">Stored · revision {design.revision}</Badge> : <Badge variant="neutral">Not stored yet</Badge>}
              {design.stored && !design.matchesCode ? <Badge variant="neutral">Differs from the running code</Badge> : null}
              {!design.inCode ? <Badge variant="neutral">No longer in code</Badge> : null}
              {synced ? <span className="text-xs text-muted-foreground">Synced {synced}</span> : null}
            </div>
          ) : null}
        </DialogHeader>

        {!design ? (
          <div className="flex min-h-[240px] items-center justify-center px-6">
            {error ? <p className="text-sm text-destructive">{error}</p> : <Loader2 className="h-6 w-6 animate-spin text-primary" />}
          </div>
        ) : (
          <>
            <div className="flex gap-1 border-b border-border px-5 pt-2 sm:px-6" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                    tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              {tab === "style" ? <StyleTab design={design} /> : null}
              {tab === "structure" ? <StructureTab design={design} /> : null}
              {tab === "css" ? (
                <CodeBlock text={design.css} label={`style.css · ${design.css.split("\n").length.toLocaleString("en-IN")} lines`} />
              ) : null}
              {tab === "json" ? (
                <CodeBlock text={JSON.stringify(design.config, null, 2)} label="Base template, style and structure" />
              ) : null}
            </div>
            <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground sm:px-6">
              Resumes render from the template code; this is the copy stored in the database.
              <span className="ml-1 font-mono">config {design.configHash.slice(0, 10)} · css {design.cssHash.slice(0, 10)}</span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
