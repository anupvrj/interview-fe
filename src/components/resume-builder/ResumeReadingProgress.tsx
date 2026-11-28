"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Opening", rest: "your PDF", short: "Open" },
  { label: "Reading", rest: "the text", short: "Read" },
  { label: "Finding", rest: "your sections", short: "Sections" },
  { label: "Matching", rest: "your design", short: "Design" },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;
const GRADIENT_TEXT = "bg-gradient-to-r from-[#8E83F5] to-[#5AA8FF] bg-clip-text text-transparent";
const MONO = "font-[family-name:var(--font-geist-mono)]";

/** Page 1 of the PDF as a small picture (null while drawing, or if it can't be drawn). */
function usePageSnapshot(file: File): string | null {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { openPdfDocument } = await import("@/lib/pdf-utils");
        const pdf = await openPdfDocument(file);
        try {
          const page = await pdf.getPage(1);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: 360 / base.width });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
          if (!cancelled) setSrc(canvas.toDataURL("image/jpeg", 0.8));
        } finally {
          void pdf.destroy();
        }
      } catch {
        /* the placeholder page stays */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);
  return src;
}

function Chip({ children, pending = false, index = 0, color }: { children: React.ReactNode; pending?: boolean; index?: number; color?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      initial={reduce ? false : { opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.12, duration: 0.35, ease: EASE }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12.5px] font-medium",
        pending ? "border border-dashed border-border text-muted-foreground" : "bg-primary/10 text-primary ring-1 ring-primary/20",
      )}
    >
      {color ? <span className="size-2.5 rounded-full ring-1 ring-white/30" style={{ background: color }} /> : pending ? null : <Check className="size-3.5" strokeWidth={2.5} />}
      {children}
    </motion.span>
  );
}

/**
 * Reading an uploaded resume, in two panes: their own first page with a scan beam, and what we
 * find as it happens (the parts of the resume, its layout, the closest design). Each step shows
 * for a moment and never runs ahead of the real work: steps 1–3 wait for the text, step 4 for
 * the closest-design match. Stays as the summary once done.
 */
export function ResumeReadingProgress({
  file,
  reading,
  matchingDesign,
  parts = null,
  layout = null,
  closestName = null,
  onRemove,
}: {
  file: File;
  /** Text extraction still running. */
  reading: boolean;
  /** Closest-design match still running (null when it doesn't apply). */
  matchingDesign: boolean | null;
  /** Parts found in the text ("Contact details", "Experience"…), once read. */
  parts?: string[] | null;
  /** The resume's look in words, once matched. */
  layout?: { label: string; color?: string }[] | null;
  /** Name of the closest design, once matched (null when none is close). */
  closestName?: string | null;
  onRemove?: () => void;
}) {
  const reduce = useReducedMotion();
  const matching = matchingDesign !== null;
  const steps = matching ? STEPS : STEPS.slice(0, 3);
  const snapshot = usePageSnapshot(file);
  const [paced, setPaced] = useState(0);

  // One step every ~0.75 s, so each is seen even when the real work is instant.
  useEffect(() => {
    const t = window.setInterval(() => setPaced((i) => Math.min(i + 1, steps.length)), 750);
    return () => window.clearInterval(t);
  }, [steps.length]);

  // How far the real work has got: text read → step 3 done; design matched → step 4 done.
  const real = reading ? 2 : matchingDesign ? 3 : steps.length;
  const current = Math.min(paced, real);
  const done = current >= steps.length;
  const shown = steps[Math.min(current, steps.length - 1)];
  const showParts = current >= 2 && parts !== null;
  const showDesign = matching && current >= 3;

  return (
    <div role="status" aria-live="polite" className="relative overflow-hidden rounded-[18px] p-4 sm:p-6">
      <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-50" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(35%_70%_at_12%_40%,rgba(115,103,240,.2),transparent_70%),radial-gradient(30%_60%_at_85%_30%,rgba(31,143,255,.08),transparent_70%)]"
      />

      <div className="relative grid gap-5 sm:grid-cols-[156px_minmax(0,1fr)] sm:gap-7 md:grid-cols-[176px_minmax(0,1fr)]">
        {/* their page, being read */}
        <div className="mx-auto w-[124px] sm:mx-0 sm:w-auto">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-b from-[#7367F0]/25 to-[#1F8FFF]/10 blur-2xl" aria-hidden />
            <div className="relative aspect-[210/297] overflow-hidden rounded-xl bg-white shadow-[0_24px_50px_-20px_rgba(20,10,80,.75)] ring-1 ring-white/10">
              {snapshot ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={snapshot} alt="" className="h-full w-full object-cover object-top" />
              ) : (
                <div className="space-y-2 p-3" aria-hidden>
                  <div className="h-2.5 w-3/4 rounded bg-slate-200" />
                  {[100, 86, 92, 70, 88, 64, 90].map((w, i) => (
                    <div key={i} className="h-1.5 rounded bg-slate-100" style={{ width: `${w}%` }} />
                  ))}
                </div>
              )}
              {!done && !reduce ? (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-[#7367F0]/[0.05]" />
                  <div
                    className="absolute inset-x-0 h-12 -translate-y-1/2 bg-gradient-to-b from-transparent via-[#7367F0]/25 to-transparent"
                    style={{ animation: "ats-scan-sweep 2.2s ease-in-out infinite" }}
                  >
                    <div className="absolute inset-x-0 top-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#7367F0] to-transparent shadow-[0_0_14px_rgba(115,103,240,.9)]" />
                  </div>
                </>
              ) : null}
              <AnimatePresence>
                {done ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-x-0 bottom-0 flex justify-end p-2">
                    <motion.span
                      initial={reduce ? false : { scale: 0.6 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                      className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#7367F0] to-[#1F8FFF] text-white shadow-[0_8px_20px_-6px_rgba(115,103,240,.9)]"
                    >
                      <Check className="size-4" strokeWidth={3} />
                    </motion.span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
          <p className={cn(MONO, "mt-3 truncate text-center text-[10.5px] text-muted-foreground")} title={file.name}>
            {file.name.toUpperCase()}
          </p>
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove file"
              className="mx-auto mt-1 flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <RefreshCw className="size-3" /> Use another file
            </button>
          ) : null}
        </div>

        {/* what we're finding */}
        <div className="min-w-0">
          <div className="h-[30px] sm:h-[34px]">
            <AnimatePresence mode="wait">
              <motion.h3
                key={done ? "done" : shown.label}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="text-[20px] font-black tracking-[-0.04em] text-foreground sm:text-[24px]"
              >
                {done ? (
                  <>
                    <span className={GRADIENT_TEXT}>Ready.</span> Your details are in
                  </>
                ) : (
                  <>
                    <span className={GRADIENT_TEXT}>{shown.label}</span> {shown.rest}
                    <span className="ml-0.5 inline-block w-5 animate-pulse text-[#7367F0]">…</span>
                  </>
                )}
              </motion.h3>
            </AnimatePresence>
          </div>

          <ol className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Reading steps">
            {steps.map((step, i) => {
              const complete = i < current;
              const active = i === current && !done;
              return (
                <li key={step.label} className="min-w-0" aria-current={active ? "step" : undefined}>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] transition-[width] duration-700 ease-out",
                        complete ? "w-full" : active ? "w-1/2 animate-pulse" : "w-0",
                      )}
                    />
                  </div>
                  <p className={cn(MONO, "mt-1.5 truncate text-[10.5px] tracking-wide", complete || active ? "text-primary" : "text-muted-foreground/70")}>
                    {complete ? "✓ " : `${String(i + 1).padStart(2, "0")} `}
                    {step.short.toUpperCase()}
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 space-y-4">
            <section aria-label="Found so far">
              <p className={cn(MONO, "text-[10.5px] tracking-wide text-muted-foreground")}>FOUND SO FAR</p>
              <div className="mt-2 flex min-h-[28px] flex-wrap gap-1.5">
                {showParts ? (
                  parts!.length ? (
                    parts!.map((p, i) => (
                      <Chip key={p} index={i}>
                        {p}
                      </Chip>
                    ))
                  ) : (
                    <span className="text-[12.5px] text-muted-foreground">Sections will be filled in when we build it.</span>
                  )
                ) : (
                  <Chip pending>Looking…</Chip>
                )}
              </div>
            </section>

            {matching ? (
              <section aria-label="Your current layout">
                <p className={cn(MONO, "text-[10.5px] tracking-wide text-muted-foreground")}>YOUR CURRENT LAYOUT</p>
                <div className="mt-2 flex min-h-[28px] flex-wrap gap-1.5">
                  {showDesign && layout ? (
                    layout.map((t, i) => (
                      <Chip key={t.label} index={i} color={t.color}>
                        {t.label}
                      </Chip>
                    ))
                  ) : (
                    <Chip pending>Measuring…</Chip>
                  )}
                </div>
              </section>
            ) : null}

            <AnimatePresence>
              {done && closestName ? (
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="flex items-center gap-3 rounded-xl border border-primary/30 bg-[linear-gradient(110deg,rgba(115,103,240,.12),transparent_70%)] px-3.5 py-2.5"
                >
                  <Sparkles className="size-4 shrink-0 text-primary" />
                  <p className="min-w-0 flex-1 text-[13.5px] text-foreground">
                    Closest design: <b className="font-semibold">{closestName}</b>
                  </p>
                  <span className="hidden text-[12px] text-muted-foreground sm:inline">picked for the next step</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
