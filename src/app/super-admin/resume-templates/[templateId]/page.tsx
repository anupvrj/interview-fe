"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { History, Loader2, RotateCcw, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { ResumeTemplateEditorPreview } from "@/components/super-admin/ResumeTemplateEditorPreview";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { AppSelect } from "@/components/ui/app-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminApi, type AdminResumeTemplateDesign } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import {
  forgetResumeTemplateAvailability,
  RESUME_TEMPLATE_AVAILABILITY_QUERY_KEY,
} from "@/lib/resume-template-availability";
import {
  extractTemplatePalette,
  FIXED_TEMPLATE_SETTINGS,
  normalizeHex,
  RESUME_FONT_OPTIONS,
  sameFontFamily,
  TEMPLATE_CATEGORY_LABELS,
  type ResumeTemplateOverrides,
  type TemplateCategory,
} from "@/lib/resume-template-overrides";
import { TemplateLoader } from "@/lib/templateLoader";
import { cn } from "@/lib/utils";

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : {});
const numOr = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

const SIZE_FIELDS = [
  { key: "heading", label: "Name", min: 16, max: 44 },
  { key: "subheading", label: "Job title", min: 10, max: 28 },
  { key: "sectionHeader", label: "Section headings", min: 8, max: 24 },
  { key: "body", label: "Body text", min: 8, max: 18 },
  { key: "small", label: "Small text (dates, contact)", min: 7, max: 16 },
] as const;

const SIDES = ["top", "right", "bottom", "left"] as const;

/** Drop empty objects and blank strings so "no edit" is always `{}`. */
function tidy(draft: ResumeTemplateOverrides): ResumeTemplateOverrides {
  const out: Rec = {};
  for (const [k, v] of Object.entries(draft)) {
    if (v === undefined || v === "" || v === null) continue;
    if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) continue;
    out[k] = v;
  }
  return out as ResumeTemplateOverrides;
}

function Section({
  title,
  scope,
  description,
  children,
}: Readonly<{ title: string; scope: "all" | "new"; description?: string; children: ReactNode }>) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {scope === "all" ? (
            <Badge variant="neutral">Applies to every resume on this template</Badge>
          ) : (
            <Badge variant="neutral">Applies to new resumes and template switches</Badge>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function FieldLabel({ children, hint }: Readonly<{ children: ReactNode; hint?: ReactNode }>) {
  return (
    <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
      <span>{children}</span>
      {hint ? <span className="font-normal">{hint}</span> : null}
    </span>
  );
}

function ResetChip({ onClick, label }: Readonly<{ onClick: () => void; label: string }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Undo2 className="h-3.5 w-3.5" />
    </button>
  );
}

function NumberField({
  label,
  value,
  codeValue,
  min,
  max,
  step = 0.5,
  unit,
  onChange,
  fixedNote,
}: Readonly<{
  label: string;
  value: number;
  codeValue: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number | undefined) => void;
  /** Shown instead of the default when the editor forces this setting. */
  fixedNote?: string;
}>) {
  const changed = value !== codeValue;
  return (
    <label className="block">
      <FieldLabel
        hint={fixedNote ? fixedNote : changed ? <ResetChip label={`Reset ${label}`} onClick={() => onChange(undefined)} /> : `default ${codeValue}${unit}`}
      >
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          disabled={Boolean(fixedNote)}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(e.target.value === "" || !Number.isFinite(n) ? undefined : n);
          }}
          className={cn("h-10 w-full pr-10", changed && "border-primary/60")}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{unit}</span>
      </div>
    </label>
  );
}

function ColorRow({
  hex,
  value,
  roles,
  uses,
  onChange,
}: Readonly<{ hex: string; value: string; roles: string[]; uses: number; onChange: (next: string | undefined) => void }>) {
  const [text, setText] = useState(value);
  const [typing, setTyping] = useState(false);
  // Don't rewrite the field under the cursor while someone is typing in it.
  useEffect(() => {
    if (!typing) setText(value);
  }, [value, typing]);
  const commit = (raw: string, allowShort: boolean) => {
    const full = /^#?[0-9a-f]{6}$/i.test(raw.trim());
    if (!full && !allowShort) return;
    const next = normalizeHex(raw.trim().startsWith("#") ? raw.trim() : `#${raw.trim()}`);
    if (next) onChange(next === hex ? undefined : next);
  };
  const changed = value !== hex;
  const roleText = roles.map((r) => r.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()).join(", ");
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border p-2.5", changed ? "border-primary/50 bg-primary/5" : "border-border")}>
      <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border/80" style={{ background: value }}>
        <span className="sr-only">Pick a colour for {hex}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase() === hex ? undefined : e.target.value.toLowerCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{roleText ? roleText.charAt(0).toUpperCase() + roleText.slice(1) : "Used in the design"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {changed ? (
            <>
              <span className="font-mono line-through">{hex}</span> → <span className="font-mono text-foreground">{value}</span>
            </>
          ) : (
            <span className="font-mono">{hex}</span>
          )}{" "}
          · {uses} {uses === 1 ? "place" : "places"}
        </p>
      </div>
      <Input
        value={text}
        onFocus={() => setTyping(true)}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value, false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(text, true);
        }}
        onBlur={() => {
          commit(text, true);
          setTyping(false);
        }}
        aria-label={`Hex colour for ${hex}`}
        className="h-9 w-[92px] font-mono text-xs"
      />
      {changed ? <ResetChip label={`Reset ${hex}`} onClick={() => onChange(undefined)} /> : <span className="w-[22px]" />}
    </div>
  );
}

export default function ResumeTemplateEditorPage() {
  const { authorized, loading } = useRequirePlatformAdmin();
  const params = useParams<{ templateId: string }>();
  const templateId = params?.templateId ?? "";
  const queryClient = useQueryClient();
  const [design, setDesign] = useState<AdminResumeTemplateDesign | null>(null);
  const [draft, setDraft] = useState<ResumeTemplateOverrides>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showNeutrals, setShowNeutrals] = useState(false);

  useEffect(() => {
    if (!authorized || !templateId) return;
    let cancelled = false;
    adminApi
      .getResumeTemplateDesign(templateId)
      .then((d) => {
        if (cancelled) return;
        setDesign(d);
        setDraft(d.overrides ?? {});
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(getApiErrorMessage(e, "Failed to load the template"));
      });
    return () => {
      cancelled = true;
    };
  }, [authorized, templateId]);

  const code = useMemo(() => {
    if (!design) return null;
    const base = rec(design.config.template);
    const style = rec(design.config.style);
    const layout = rec(rec(design.config.structure.rendering).layout);
    const widths = rec(layout.columnWidths);
    const sizes = rec(style.fontSize);
    return {
      fontFamily: String(style.fontFamily ?? rec(base.layout).fontFamily ?? ""),
      sizes: {
        heading: numOr(sizes.heading, 24),
        subheading: numOr(sizes.subheading, 16),
        body: numOr(sizes.body, 12),
        small: numOr(sizes.small, 10),
        sectionHeader: numOr(rec(style.sectionHeader).fontSize, 13),
      } as Record<(typeof SIZE_FIELDS)[number]["key"], number>,
      lineHeight: numOr(style.lineHeight, 1.4),
      sectionSpacing: numOr(style.sectionSpacing, numOr(rec(base.layout).sectionSpacing, 10)),
      padding: {
        top: numOr(rec(style.padding).top, 8),
        right: numOr(rec(style.padding).right, 8),
        bottom: numOr(rec(style.padding).bottom, 8),
        left: numOr(rec(style.padding).left, 8),
      },
      twoColumns: layout.type !== "single" && typeof widths.right === "number" && widths.right > 0,
      leftWidth: numOr(widths.left, 50),
      palette: extractTemplatePalette(design.css, { ...rec(base.colors), ...rec(style.colors) }),
    };
  }, [design]);

  const saved = useMemo(() => JSON.stringify(tidy(design?.overrides ?? {})), [design]);
  const dirty = JSON.stringify(tidy(draft)) !== saved;
  const edited = Boolean(design?.overrides);

  // Blank text stays in the draft while typing; tidy() drops it when comparing and saving.
  const set = <K extends keyof ResumeTemplateOverrides>(key: K, value: ResumeTemplateOverrides[K] | undefined) =>
    setDraft((d) => {
      const next = { ...d };
      if (value === undefined) delete next[key];
      else next[key] = value;
      return next;
    });
  const setNested = <K extends "fontSize" | "padding" | "palette">(key: K, sub: string, value: unknown) =>
    setDraft((d) => {
      const inner = { ...rec(d[key]) };
      if (value === undefined) delete inner[sub];
      else inner[sub] = value;
      return tidy({ ...d, [key]: inner });
    });

  const refreshEverywhere = async () => {
    forgetResumeTemplateAvailability();
    TemplateLoader.clearCache();
    await queryClient.invalidateQueries({ queryKey: RESUME_TEMPLATE_AVAILABILITY_QUERY_KEY });
  };

  const save = async () => {
    if (!design) return;
    setSaving(true);
    try {
      const next = await adminApi.saveResumeTemplateDesign(templateId, tidy(draft), design.overridesRevision ?? 0);
      setDesign(next);
      setDraft(next.overrides ?? {});
      await refreshEverywhere();
      toast.success(next.overrides ? "Template saved. Every page now shows the new design." : "No changes from the original design.");
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Failed to save the template"));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    try {
      const next = await adminApi.resetResumeTemplateDesign(templateId);
      setDesign(next);
      setDraft({});
      setConfirmReset(false);
      await refreshEverywhere();
      toast.success("Template is back to its original design.");
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Failed to reset the template"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !authorized) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const title = draft.name || design?.name || "Template";
  const fixed = FIXED_TEMPLATE_SETTINGS[templateId] ?? {};
  const brand = code?.palette.filter((c) => !c.neutral) ?? [];
  const neutrals = code?.palette.filter((c) => c.neutral) ?? [];
  const currentFont = draft.fontFamily ?? code?.fontFamily ?? "";
  const fontOptions = code ? RESUME_FONT_OPTIONS.filter((o) => !sameFontFamily(o.value, code.fontFamily)) : [];
  const originalFontLabel = code ? `Original (${code.fontFamily.split(",")[0].replace(/['"]/g, "").trim()})` : "Original";

  return (
    <div className="space-y-6 pb-24">
      <SuperAdminPageHeader
        title={`Edit ${title}`}
        description={
          <>
            <span className="font-mono">{templateId}</span>
            {design?.overridesUpdatedAt ? (
              <> · last saved {new Date(design.overridesUpdatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</>
            ) : null}
          </>
        }
        backHref="/super-admin/resume-templates"
        backLabel="Resume Templates"
        unsavedChanges={dirty}
        actions={
          edited ? (
            <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setConfirmReset(true)}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset to original
            </Button>
          ) : null
        }
      />

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      {!design || !code ? (
        loadError ? null : (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
          <div className="min-w-0 space-y-6">
            <Section title="Details" scope="all" description="How the template appears in every template list.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <FieldLabel hint={draft.name ? <ResetChip label="Reset name" onClick={() => set("name", undefined)} /> : undefined}>Name</FieldLabel>
                  <Input value={draft.name ?? design.name} maxLength={40} onChange={(e) => set("name", e.target.value === design.name ? undefined : e.target.value)} className="h-10 w-full" />
                </label>
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <AppSelect
                    value={draft.category ?? design.category}
                    onChange={(v) => set("category", v === design.category ? undefined : (v as TemplateCategory))}
                    options={(Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateCategory[]).map((c) => ({ value: c, label: TEMPLATE_CATEGORY_LABELS[c] }))}
                  />
                </div>
              </div>
              <label className="block">
                <FieldLabel hint={`${(draft.description ?? design.description).length}/160`}>Description</FieldLabel>
                <Textarea
                  value={draft.description ?? design.description}
                  maxLength={160}
                  rows={2}
                  onChange={(e) => set("description", e.target.value === design.description ? undefined : e.target.value)}
                />
              </label>
            </Section>

            <Section
              title="Colours"
              scope="all"
              description="The colours this template uses. Change one and it changes everywhere it appears, including PDFs."
            >
              {brand.length === 0 ? (
                <p className="text-sm text-muted-foreground">This design uses only black, white and greys.</p>
              ) : null}
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {brand.map((c) => (
                  <ColorRow key={c.hex} hex={c.hex} value={draft.palette?.[c.hex] ?? c.hex} roles={c.roles} uses={c.uses} onChange={(v) => setNested("palette", c.hex, v)} />
                ))}
              </div>
              {neutrals.length ? (
                <div>
                  <button type="button" onClick={() => setShowNeutrals((v) => !v)} className="text-sm font-medium text-primary hover:underline">
                    {showNeutrals ? "Hide" : "Show"} black, white and greys ({neutrals.length})
                  </button>
                  {showNeutrals ? (
                    <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-2">
                      {neutrals.map((c) => (
                        <ColorRow key={c.hex} hex={c.hex} value={draft.palette?.[c.hex] ?? c.hex} roles={c.roles} uses={c.uses} onChange={(v) => setNested("palette", c.hex, v)} />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Section>

            <Section title="Font" scope="all" description="Resumes on this template switch to it, unless their owner picked another font.">
              <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Font family</FieldLabel>
                  <AppSelect
                    value={draft.fontFamily ?? ""}
                    onChange={(v) => set("fontFamily", v || undefined)}
                    options={fontOptions}
                    allowEmpty
                    emptyLabel={originalFontLabel}
                  />
                </div>
                <p className="truncate rounded-lg border border-border px-3 py-2 text-lg text-foreground" style={{ fontFamily: currentFont }}>
                  {title} — Aa Bb 123
                </p>
              </div>
            </Section>

            <Section title="Text sizes" scope="new" description="Owners can still change these on their own resume.">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {SIZE_FIELDS.map((f) => (
                  <NumberField
                    key={f.key}
                    label={f.label}
                    value={draft.fontSize?.[f.key] ?? code.sizes[f.key]}
                    codeValue={code.sizes[f.key]}
                    min={f.min}
                    max={f.max}
                    unit="px"
                    onChange={(v) => setNested("fontSize", f.key, v === code.sizes[f.key] ? undefined : v)}
                  />
                ))}
                <NumberField
                  label="Line height"
                  value={draft.lineHeight ?? code.lineHeight}
                  codeValue={code.lineHeight}
                  min={1}
                  max={2}
                  step={0.05}
                  unit="×"
                  onChange={(v) => set("lineHeight", v === code.lineHeight ? undefined : v)}
                />
              </div>
            </Section>

            <Section
              title="Page layout"
              scope="new"
              description={`${code.twoColumns ? "Two columns" : "Single column"}: each template's column layout is part of its design and can't be switched here.`}
            >
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {SIDES.map((side) => {
                  const fixedSide = fixed.sideMarginsMm !== undefined && (side === "left" || side === "right");
                  return (
                    <NumberField
                      key={side}
                      label={`${side.charAt(0).toUpperCase()}${side.slice(1)} margin`}
                      value={fixedSide ? (fixed.sideMarginsMm as number) : draft.padding?.[side] ?? code.padding[side]}
                      codeValue={fixedSide ? (fixed.sideMarginsMm as number) : code.padding[side]}
                      min={0}
                      max={30}
                      unit="mm"
                      fixedNote={fixedSide ? "fixed by this design" : undefined}
                      onChange={(v) => setNested("padding", side, v === code.padding[side] ? undefined : v)}
                    />
                  );
                })}
              </div>
              {code.twoColumns && fixed.columnWidths ? (
                <p className="text-sm text-muted-foreground">
                  Column widths: {code.leftWidth}% / {100 - code.leftWidth}%, fixed by this design.
                </p>
              ) : null}
              {code.twoColumns && !fixed.columnWidths ? (
                <div>
                  <FieldLabel
                    hint={
                      draft.columnWidths ? (
                        <ResetChip label="Reset column widths" onClick={() => set("columnWidths", undefined)} />
                      ) : (
                        `default ${code.leftWidth}% / ${100 - code.leftWidth}%`
                      )
                    }
                  >
                    Column widths
                  </FieldLabel>
                  <div className="flex items-center gap-3">
                    <span className="w-24 text-sm tabular-nums text-foreground">Left {draft.columnWidths?.left ?? code.leftWidth}%</span>
                    <input
                      type="range"
                      min={20}
                      max={80}
                      step={1}
                      value={draft.columnWidths?.left ?? code.leftWidth}
                      onChange={(e) => {
                        const left = Number(e.target.value);
                        set("columnWidths", left === code.leftWidth ? undefined : { left, right: 100 - left });
                      }}
                      className="h-2 flex-1 cursor-pointer accent-[#7367F0]"
                      aria-label="Left column width"
                    />
                    <span className="w-24 text-right text-sm tabular-nums text-foreground">Right {100 - (draft.columnWidths?.left ?? code.leftWidth)}%</span>
                  </div>
                </div>
              ) : null}
            </Section>

            <Section
              title="Spacing between sections"
              scope="all"
              description="Space added below each section. Some designs add more in their own styles. Resumes don't keep their own, so a change can move content onto another page."
            >
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <NumberField
                  label="Section spacing"
                  value={draft.sectionSpacing ?? code.sectionSpacing}
                  codeValue={code.sectionSpacing}
                  min={0}
                  max={40}
                  step={1}
                  unit="px"
                  onChange={(v) => set("sectionSpacing", v === code.sectionSpacing ? undefined : v)}
                />
              </div>
            </Section>

            {design.overrideHistory?.length ? (
              <Section title="History" scope="all" description="Load an earlier save into the editor, then Save to apply it again.">
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {design.overrideHistory.map((h) => (
                    <li key={h.revision} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="text-foreground">
                          Revision {h.revision}
                          {h.revision === design.overridesRevision ? <span className="ml-2 text-xs text-primary">current</span> : null}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {h.updatedAt ? new Date(h.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                          {" · "}
                          {h.overrides ? `${Object.keys(h.overrides).length} kind(s) of change` : "Reset to original"}
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setDraft(h.overrides ?? {})}>
                        <History className="mr-1.5 h-3.5 w-3.5" />
                        Load
                      </Button>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}
          </div>

          <div className="xl:sticky xl:top-24 xl:self-start">
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Live preview</h2>
                  <span className="text-xs text-muted-foreground">{dirty ? "Unsaved changes" : "Matches what users see"}</span>
                </div>
                <ResumeTemplateEditorPreview templateId={templateId} draft={tidy(draft)} />
                <p className="text-xs text-muted-foreground">
                  Sample content. Template thumbnails in the pickers are images and don&apos;t change.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {dirty ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-end gap-2 px-4 py-3 sm:px-6">
            <span className="mr-auto text-sm text-muted-foreground">You have unsaved changes to {title}.</span>
            <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setDraft(design?.overrides ?? {})}>
              Discard
            </Button>
            <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Save and publish
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmationDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={`Reset ${title} to its original design?`}
        description="Every edit to this template is removed and resumes go back to the coded design. The edits stay in the history."
        confirmText="Reset"
        onConfirm={reset}
        isLoading={saving}
      />
    </div>
  );
}
