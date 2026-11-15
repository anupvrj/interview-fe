"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { ArrowRight, CheckCircle2, CircleDashed, FileCheck2, FileText, Loader2, Lock, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaginatedPreview } from "@/components/PaginatedPreview";
import { CanvasEditProvider } from "@/components/resume-canvas/CanvasEditContext";
import { ScoreRing } from "@/components/dashboard-2026/ui";
import { Mono } from "@/components/marketing-2026/primitives";
import { TEMPLATES_CATALOG } from "@/configs/resume-templates/templates-catalog";
import { atsGuestApi, resumeApi, type ATSGuestTeaser, type GuestRewrite, type Resume, type ResumeTemplate } from "@/lib/api";
import { buildResumeTemplateApplication, type ApplyResumeTemplateResult } from "@/lib/applyResumeTemplate";
import { ATS_RESUME_TEMPLATE_ID, rememberGuestATSTemplate } from "@/lib/atsCheckFlow";
import { fetchDisabledResumeTemplateIds } from "@/lib/resume-template-availability";
import type { ATSReportV3 } from "@/types/atsReport";
import { rewriteChanges } from "@/lib/atsRewriteDiff";
import { loadPendingUpload } from "@/lib/atsPendingFile";
import { inAppBrowserName } from "@/lib/atsGuestState";
import { renderPdfPages, type PdfPage } from "@/lib/pdf-snapshot";
import { ATSReportWorkspace } from "./ATSReportWorkspace";
import { cssRegistry } from "@/lib/templateLoader";
import { cn } from "@/lib/utils";

/** What only they can add, which no rewrite can make up. */
const NEEDS_YOU: Record<string, string> = {
  quantifyingImpact: "ADD YOUR NUMBERS",
  placeholderValues: "ADD YOUR DETAILS",
  headerLinks: "ADD YOUR LINKS",
  contactInformation: "ADD YOUR DETAILS",
};

const DEFAULT_SIGN_UP_HREF = `/sign-up?redirect_url=${encodeURIComponent("/dashboard/ats-checker")}`;
/** A4 at 96dpi, the width PaginatedPreview lays pages out at. */
const PAGE_WIDTH = 794;

/** ATS-friendly designs to try on. More than this is a decision, not a preview. */
const TRY_ON_TEMPLATES = [ATS_RESUME_TEMPLATE_ID, "harvard", "meridian", "royal-indigo"];
const templateName = (id: string) => TEMPLATES_CATALOG.find((t) => t.id === id)?.name ?? "our template";
/** Each page on its own sheet: no gap to fill after the last one. */
const PAGE_STACK = "[&_.resume-page]:ring-1 [&_.resume-page]:ring-slate-900/5 [&_.relative.mb-5:last-child]:!mb-0";
const PAGE_SHADOW = "drop-shadow-[0_30px_40px_rgba(30,20,90,.18)]";

function verdict(score: number) {
  if (score >= 80) return { label: "Ready to send", tone: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 60) return { label: "Close, a few fixes away", tone: "text-primary" };
  return { label: "Needs work before you apply", tone: "text-amber-600 dark:text-amber-400" };
}

/** Their real content in a template: the same thing they'll edit after signing up. */
function RebuiltResume({ templateId, content, sectionOrder }: { templateId: string; content?: Record<string, unknown>; sectionOrder?: unknown[] }) {
  const [shown, setShown] = useState<{ template: ResumeTemplate; application: ApplyResumeTemplateResult } | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(0.6);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!content) return;
    let cancelled = false;
    (async () => {
      try {
        const [template, application] = await Promise.all([
          resumeApi.getTemplate(templateId),
          buildResumeTemplateApplication(templateId, { content, sectionOrder } as Pick<Resume, "content" | "sectionOrder">),
          cssRegistry.loadTemplateCSS(templateId),
        ]);
        if (!cancelled) setShown({ template, application });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateId, content, sectionOrder]);

  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const fit = () => setZoom(el.clientWidth / PAGE_WIDTH);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const resume = shown && ({
    resumeId: "ats-preview",
    userId: "",
    title: "Your resume",
    templateId: shown.application.templateId,
    content,
    sectionOrder: shown.application.sectionOrder,
    layout: shown.application.layout,
    profileSummary: typeof content?.profileSummary === "string" ? content.profileSummary : "",
  } as unknown as Resume);

  return (
    <div ref={frame} className="w-full">
      {failed || !content ? (
        <p className="rounded-lg bg-white py-16 text-center text-[14px] text-slate-500">The preview couldn&apos;t load. Your resume is safe.</p>
      ) : !shown || !resume ? (
        <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        // the pages bring their own paper and shadow; this only drops the gap after the last one
        <div className={cn("pointer-events-none [&_.resume-page]:!shadow-none [&_.resume-page]:rounded-[6px]", PAGE_STACK)} style={{ zoom }}>
          <CanvasEditProvider value={null}>
            <PaginatedPreview resume={resume} template={shown.template} sections={shown.application.sectionOrder} layout={shown.application.layout} />
          </CanvasEditProvider>
        </div>
      )}
    </div>
  );
}

type View = "current" | "after";

/**
 * A signed-out visitor's report: the same page as a signed-in one, with some checks locked
 * and "Fix my resume, free" signing them up. "After improvement" previews the AI rewrite.
 */
export function ATSGuestResult({
  teaser,
  report,
  fileName,
  content,
  sectionOrder,
  token,
  improved: improvedAlready,
  onCheckAnother,
}: {
  teaser: ATSGuestTeaser;
  /** Scores for everything; findings for most checks, the rest locked. */
  report: ATSReportV3;
  fileName?: string;
  content?: Record<string, unknown>;
  sectionOrder?: unknown[];
  /** Lets the page ask for the AI rewrite of this check. */
  token?: string;
  /** A rewrite made earlier for this same check (the same file uploaded again). */
  improved?: GuestRewrite | null;
  onCheckAnother: () => void;
}) {
  const reduce = useReducedMotion();
  // In Instagram/LinkedIn/Facebook's own browser, Google sign-in often fails and people tap
  // "Open in browser", which doesn't share this browser's storage. There the check travels
  // in the link itself; elsewhere it stays out of URLs.
  const [inApp, setInApp] = useState<string | null>(null);
  useEffect(() => setInApp(inAppBrowserName()), []);
  const SIGN_UP_HREF =
    inApp && token
      ? `/sign-up?redirect_url=${encodeURIComponent(`/dashboard/ats-checker?check=${token}`)}`
      : DEFAULT_SIGN_UP_HREF;
  const [view, setView] = useState<View>("current");
  const [templateId, setTemplateId] = useState(ATS_RESUME_TEMPLATE_ID);
  const [tryOn, setTryOn] = useState<string[]>([ATS_RESUME_TEMPLATE_ID]);

  // Asked for straight away, so "After improvement" is ready by the time they switch to it.
  const [rewrite, setRewrite] = useState<{ state: "loading" | "ready" | "failed"; value?: GuestRewrite }>(
    improvedAlready ? { state: "ready", value: improvedAlready } : { state: token ? "loading" : "failed" },
  );
  useEffect(() => {
    if (improvedAlready || !token) return;
    let cancelled = false;
    atsGuestApi
      .rewrite(token)
      .then((value) => !cancelled && setRewrite({ state: "ready", value }))
      .catch(() => !cancelled && setRewrite({ state: "failed" }));
    return () => {
      cancelled = true;
    };
  }, [token, improvedAlready]);
  const rewritten = rewrite.state === "ready" ? rewrite.value : undefined;

  useEffect(() => {
    void fetchDisabledResumeTemplateIds().then((off) =>
      setTryOn(TRY_ON_TEMPLATES.filter((id) => id === ATS_RESUME_TEMPLATE_ID || !off.includes(id))),
    );
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // Their own PDF, as they designed it (kept in this browser until they sign up).
  const [originalPdf, setOriginalPdf] = useState<PdfPage[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    void loadPendingUpload()
      .then((pending) => (pending ? renderPdfPages(pending.file) : null))
      .then((pages) => !cancelled && setOriginalPdf(pages))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const pickTemplate = (id: string) => {
    setTemplateId(id);
    rememberGuestATSTemplate(id);
  };

  // Stacked layouts put the resume below this switch: bring it into view, or the switch
  // seems to do nothing.
  const stageRef = useRef<HTMLDivElement>(null);
  const switchView = (next: View) => {
    setView(next);
    requestAnimationFrame(() => {
      const stage = stageRef.current?.closest("section, div.grid")?.querySelector("[data-resume-stage]") as HTMLElement | null;
      const target = stage ?? stageRef.current;
      if (!target) return;
      const { top, bottom } = target.getBoundingClientRect();
      if (top > window.innerHeight * 0.6 || bottom < 120) {
        target.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      }
    });
  };

  const after = view === "after";
  // Nothing about the improved state shows until the improved resume itself is there.
  const afterLoading = after && rewrite.state === "loading";
  const afterReady = after && !afterLoading;
  // Where the AI wants their real numbers ({XX%}); the score counts them as sample text.
  const numbersToFill = useMemo(
    () => (rewrite.value ? (JSON.stringify(rewrite.value.content).match(/[{[]X+%?[}\]]/gi) ?? []).length : 0),
    [rewrite.value],
  );
  // What the rewrite really changed: only findings whose line it rewrote count as fixed.
  const changes = useMemo(
    () => (rewritten ? rewriteChanges(report, content, rewritten.content) : []),
    [report, content, rewritten],
  );
  const fixedCount = changes.filter((c) => c.status === "fixed").length;
  const leftCount = changes.length - fixedCount + (numbersToFill > 0 ? 1 : 0);
  // One cautious number everywhere: a little under the estimate, never below today's score.
  const expected = Math.max(Math.round(teaser.score), Math.floor((teaser.possibleScore - 10) / 5) * 5);
  const shownScore = afterReady ? expected : teaser.score;
  const v = afterLoading ? { label: "Preparing your improved resume", tone: "text-muted-foreground" } : verdict(shownScore);

  // The page with its findings marked, as it'll be saved when they sign up.
  const resume = useMemo(
    () =>
      ({
        resumeId: "ats-preview",
        userId: "",
        title: fileName ?? "Your resume",
        templateId: ATS_RESUME_TEMPLATE_ID,
        content,
        sectionOrder,
        profileSummary: typeof content?.profileSummary === "string" ? content.profileSummary : "",
      }) as unknown as Resume,
    [content, sectionOrder, fileName],
  );

  const scoreBox = (
    <div ref={stageRef}>
      <div className="flex items-center gap-4">
        <div className="[&_p]:font-bold [&_p]:tracking-tight"><ScoreRing score={Math.round(shownScore)} /></div>
        <div className="min-w-0">
          <Mono className="text-[11px] text-muted-foreground">{afterLoading ? "ESTIMATING…" : afterReady ? (leftCount > 0 ? "WHEN YOU FINISH" : "ESTIMATED AFTER FIXES") : "SMART ATS SCORE"}</Mono>
          <p className={cn("mt-1 text-[16px] font-semibold leading-snug", v.tone)}>{v.label}</p>
        </div>
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
        {afterLoading
          ? "Rewriting your resume with the fixes. The new score shows when it's ready."
          : after
            ? rewrite.state === "failed"
              ? "Your content in an ATS-friendly design. Wording fixes happen in the editor."
              : leftCount > 0
                ? `The AI rewrite fixed ${fixedCount}. Sign up to keep it, then finish the other ${leftCount} in the editor to reach about this score.`
                : "Rewritten by AI with the fixes applied. Sign up and this becomes your resume, ready to edit."
            : "An estimate of how well ATS software can read your resume."}
      </p>
      {!afterReady && <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="text-[13.5px] font-medium text-foreground">
          {afterLoading ? "Your score today" : "Could reach, when fixed"}
        </p>
        <Mono className="text-[18px] font-semibold text-foreground">{afterLoading ? Math.round(teaser.score) : `${expected}+`}</Mono>
      </div>}
    </div>
  );

  const readyDot = rewrite.state === "ready" && view !== "after" && <span className="size-1.5 rounded-full bg-emerald-500" aria-label="Ready" />;
  const preparingIcon = rewrite.state === "loading" && <Loader2 className="h-3 w-3 animate-spin" aria-label="Preparing" />;
  const viewSwitch = (
    <div role="tablist" aria-label="Resume view" className="inline-grid w-full grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1 sm:w-fit">
      {([["current", "Your resume"], ["after", "Improved"]] as const).map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={view === id}
          onClick={() => switchView(id)}
          className={cn(
            "min-h-9 rounded-lg px-3.5 text-[13px] font-semibold transition-colors",
            view === id ? (id === "after" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-foreground") : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            {id === "after" && <Sparkles className="h-3.5 w-3.5" />}
            {label}
            {id === "after" && preparingIcon}
            {id === "after" && readyDot}
          </span>
        </button>
      ))}
    </div>
  );
  const secondaryAction = (
    <Button variant="outline" onClick={() => switchView(after ? "current" : "after")} className="h-11 w-full rounded-xl px-5 lg:w-auto">
      {after ? <FileText className="h-4 w-4" /> : <FileCheck2 className="h-4 w-4" />}
      {after ? "See your resume" : "See improved version"}
      {!after && preparingIcon}
      {!after && readyDot}
    </Button>
  );

  // "After improvement": the rewritten resume, in the design they pick.
  const stage = after ? (
    <section data-resume-stage className="flex h-[70vh] min-h-[520px] scroll-mt-24 flex-col overflow-hidden rounded-[22px] border border-border bg-card xl:h-full xl:min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <Mono className="text-[11px] text-muted-foreground">YOUR RESUME, IMPROVED</Mono>
        {tryOn.length > 1 && rewrite.state !== "loading" && (
          <div role="group" aria-label="Try a template" className="flex flex-wrap gap-1.5">
            {tryOn.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={templateId === id}
                onClick={() => pickTemplate(id)}
                className={cn(
                  "min-h-8 rounded-lg border px-2.5 text-[12.5px] font-semibold transition-colors",
                  templateId === id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {templateName(id)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="relative min-h-0 flex-1 overflow-auto bg-[radial-gradient(70%_50%_at_50%_0%,rgba(115,103,240,.22),transparent_75%),radial-gradient(60%_50%_at_100%_100%,rgba(31,143,255,.14),transparent_70%)] bg-muted/40 p-5 sm:p-8">
        <div className={cn("mx-auto max-w-[620px]", PAGE_SHADOW)}>
          {rewrite.state === "loading" ? (
            <div className="flex aspect-[0.707] w-full flex-col items-center justify-center gap-3 rounded-[6px] bg-white px-8 text-center ring-1 ring-slate-900/5">
              <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
              <p className="text-[15px] font-semibold text-slate-900">Rewriting your resume with the fixes…</p>
              <p className="text-[13px] text-slate-500">This takes about half a minute.</p>
            </div>
          ) : (
            <RebuiltResume templateId={templateId} content={rewritten?.content ?? content} sectionOrder={rewritten?.sectionOrder ?? sectionOrder} />
          )}
        </div>
      </div>
    </section>
  ) : undefined;

  const side = afterReady ? (
    <section className="overflow-hidden rounded-[22px] border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <Mono className="text-[11px] text-primary">— IN THIS VERSION —</Mono>
        <p className="mt-1 text-[15px] font-semibold text-foreground">
          {rewritten ? `${fixedCount} fixed by the rewrite` : "Your content, redesigned"}
        </p>
        {leftCount > 0 && (
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {leftCount} more to finish in the editor after you sign up.
          </p>
        )}
      </div>
      <ul className="space-y-2 p-4">
        {changes.map((row) => (
          <li
            key={row.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3",
              row.status === "fixed" ? "border-emerald-500/30 bg-emerald-500/[0.07]" : "border-border bg-background",
            )}
          >
            <span className="flex min-w-0 items-center gap-2.5 text-[14px] text-foreground">
              {row.status === "fixed" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : row.status === "partly" ? (
                <CircleDashed className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              ) : row.status === "locked" ? (
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <PenLine className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">{row.label}</span>
            </span>
            <Mono
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px]",
                row.status === "fixed" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                row.status === "partly" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                (row.status === "editor" || row.status === "locked") && "bg-muted text-muted-foreground",
              )}
            >
              {row.status === "fixed" ? "FIXED" : row.status === "partly" ? `${row.changed} OF ${row.total}` : row.status === "locked" ? "SIGN UP TO SEE" : NEEDS_YOU[row.id] ?? "IN THE EDITOR"}
            </Mono>
          </li>
        ))}
        {numbersToFill > 0 && (
          <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-3">
            <span className="flex min-w-0 items-center gap-2.5 text-[14px] text-foreground">
              <PenLine className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">Your real numbers</span>
            </span>
            <Mono className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] text-muted-foreground">{numbersToFill} TO FILL IN</Mono>
          </li>
        )}
      </ul>
      <div className="border-t border-border bg-muted/30 p-4">
        <Button asChild className="h-11 w-full rounded-xl hover:bg-primary/90">
          <Link href={SIGN_UP_HREF}>Keep the improved version<ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </section>
  ) : undefined;

  // Any way to sign up from here: start getting their resume ready while they make the
  // account, so "Opening your resume" afterwards is instant.
  const prepared = useRef(false);
  const prepareOnSignUp = (event: React.MouseEvent) => {
    if (prepared.current || !token) return;
    if (!(event.target as HTMLElement).closest?.('a[href^="/sign-up"]')) return;
    prepared.current = true;
    void atsGuestApi.prepare(token).catch(() => {});
  };

  return (
    <div className="mx-auto w-full max-w-7xl pb-24 lg:pb-0" onClickCapture={prepareOnSignUp}>
      <ATSReportWorkspace
        report={report}
        resumeTitle={fileName}
        improveUnlocked={false}
        improving={false}
        rerunning={false}
        onImprove={() => {}}
        onChooseTemplate={() => {}}
        onIgnoreIssue={async () => {}}
        onRerun={() => {}}
        onCheckAnother={onCheckAnother}
        onRunJobMatch={() => {}}
        originalPdf={originalPdf}
        guest={{ signUpHref: SIGN_UP_HREF, resume, scoreBox, stage, side, secondaryAction, viewSwitch, onCheckAnother }}
      />

      {inApp && (
        <p className="mx-auto mt-4 max-w-xl rounded-xl border border-border bg-card px-4 py-3 text-center text-[13px] text-muted-foreground">
          In the {inApp} app? If Google sign-in doesn&apos;t open, tap <span className="font-semibold text-foreground">⋯ → Open in browser</span>. Your check comes with you.
        </p>
      )}

      {/* phones: the next step is always in reach */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <Button asChild className="h-12 w-full rounded-xl text-[15.5px] hover:bg-primary/90">
          <Link href={SIGN_UP_HREF}>Fix my resume, free<ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  );
}
