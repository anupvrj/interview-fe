"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, useReducedMotion } from "motion/react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import {
  ArrowRight,
  Copy,
  Download,
  FileSearch,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { resumeApi, type Resume } from "@/lib/api";
import { downloadPdfFromUrl, fetchPdfBlobFromUrl, resumePdfFilenameFromResume } from "@/lib/download-pdf";
import {
  ensureExtensionSession,
  notifyExtensionResumeCompiled,
  pingInterviewTrixExtension,
  resolveExtensionJobLink,
} from "@/lib/extension-resume-sync";
import { fetchResumePlaceholderIssues, type ResumePlaceholderIssue } from "@/lib/resume-placeholder-check";
import { dismissReviewReminder, shouldShowReviewReminder } from "@/lib/resume-review-reminder";
import { cn } from "@/lib/utils";
import { TEMPLATES_CATALOG } from "@/configs/resume-templates/templates-catalog";
import { useResumesQuery } from "@/hooks/queries/useResumesQuery";
import { useDashboardInvalidation } from "@/hooks/useDashboardInvalidation";
import { useEntitlements } from "@/hooks/useEntitlements";
import { ExtensionSyncedDialog } from "@/components/chrome-extension/ExtensionSyncedDialog";
import { ChromeIcon } from "@/components/chrome-extension/ChromeIcon";
import { AddToChromeButton } from "@/components/chrome-extension/AddToChromeButton";
import { DashboardResumesList } from "@/components/dashboard/DashboardResumesList";
import { TrialUpsellDialog } from "@/components/upsell/TrialUpsellDialog";
import { PlaceholderDataDialog } from "@/components/resume-editor/PlaceholderDataDialog";
import { Mono } from "@/components/marketing-2026/primitives";
import { dash2026Scope, EASE, Eyebrow } from "./ui";

const PAGE = 14; // plus the "new resume" tile = three full rows of five
const VIEW_KEY = "ix-resumes-view";
type Sort = "edited" | "ats" | "name";
type View = "grid" | "list";

const templateById = new Map(TEMPLATES_CATALOG.map((t) => [t.id, t]));
const starterTemplates = [...TEMPLATES_CATALOG].sort((a, b) => Number(b.popular) - Number(a.popular)).slice(0, 8);

function ago(date: string) {
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = s / 60, h = m / 60, d = h / 24;
  if (m < 60) return `${Math.floor(m)} min ago`;
  if (h < 24) return `${Math.floor(h)} h ago`;
  if (d < 2) return "yesterday";
  if (d < 30) return `${Math.floor(d)} days ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const hasAts = (r: Resume) => typeof r.atsScore === "number" && Number.isFinite(r.atsScore);
function atsTone(score: number) {
  if (score >= 80) return "bg-emerald-500 text-white";
  if (score >= 60) return "bg-primary text-white";
  if (score >= 40) return "bg-amber-500 text-white";
  return "bg-rose-500 text-white";
}
const roleOf = (r: Resume) => r.content?.experience?.[0]?.position;

/** A page-shaped preview: the template the resume uses, with its ATS score pinned on it. */
function Paper({ src, alt, score, className }: { src?: string; alt: string; score?: number; className?: string }) {
  return (
    <div className={cn("relative aspect-[1/1.3] overflow-hidden rounded-xl border border-border bg-white shadow-[0_18px_40px_-28px_rgba(47,43,61,.55)]", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes="(min-width:1280px) 22vw, (min-width:640px) 45vw, 90vw" className="object-cover object-top" />
      ) : (
        <div className="space-y-2 p-5">{[70, 45, 90, 85, 60, 88, 75].map((w, i) => <div key={i} className="h-2 rounded bg-slate-200" style={{ width: `${w}%` }} />)}</div>
      )}
      {score != null && (
        <span className={cn("absolute right-2.5 top-2.5 rounded-lg px-2 py-1 text-[11px] font-bold shadow-sm", atsTone(score))}>
          <Mono>ATS {Math.round(score)}</Mono>
        </span>
      )}
    </div>
  );
}

export function ResumesHome() {
  const reduce = useReducedMotion();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const extensionSyncMode = searchParams.get("extensionSync") === "1";
  const extensionConnectMode = searchParams.get("extensionConnect") === "1";
  const { data: resumes = [], isLoading: loading } = useResumesQuery();
  const { invalidate } = useDashboardInvalidation();
  const { canUse, data: entitlements } = useEntitlements();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [sendingToChromeId, setSendingToChromeId] = useState<string | null>(null);
  const [placeholderCheck, setPlaceholderCheck] = useState<{ resumeId: string; issues: ResumePlaceholderIssue[] } | null>(null);
  const [extensionSyncNotice, setExtensionSyncNotice] = useState<string | null>(null);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [trialUpsellOpen, setTrialUpsellOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncDialogVariant, setSyncDialogVariant] = useState<"synced" | "connected">("synced");

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("edited");
  const [view, setView] = useState<View>("grid");
  const [shown, setShown] = useState(PAGE);
  const [listPage, setListPage] = useState(1);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "grid" || v === "list") setView(v);
    } catch { /* per-viewer convenience only */ }
  }, []);
  const changeView = (v: View) => {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (extensionConnectMode) {
      router.replace("/dashboard/extension/connected");
      return;
    }
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      void ensureExtensionSession();
    }
  }, [extensionConnectMode, isLoaded, router, user]);

  useEffect(() => {
    if (extensionSyncMode) setExtensionSyncNotice("Pick a resume and send it to the Chrome extension, then return to the job tab and Attach.");
  }, [extensionSyncMode]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? resumes.filter((r) =>
          [r.title, r.content?.personalInfo?.fullName, roleOf(r), templateById.get(r.templateId)?.name]
            .some((v) => typeof v === "string" && v.toLowerCase().includes(q)),
        )
      : resumes;
    return [...rows].sort((a, b) =>
      sort === "name" ? a.title.localeCompare(b.title)
        : sort === "ats" ? (b.atsScore ?? -1) - (a.atsScore ?? -1)
          : +new Date(b.updatedAt) - +new Date(a.updatedAt),
    );
  }, [resumes, query, sort]);

  // ── actions (same behaviour as the legacy page)
  const createResume = async (templateId?: string) => {
    if (!user) return;
    const target = templateId ? `/dashboard/resumes/new?template=${encodeURIComponent(templateId)}&skipTemplate=true` : "/dashboard/resumes/new";
    try {
      setCheckingLimit(true);
      const limit = await resumeApi.checkResumeLimit();
      if (!limit.allowed) {
        setShowLimitModal(true);
        return;
      }
      router.push(target);
    } catch (error) {
      console.error("Error checking resume limit:", error);
      router.push(target);
    } finally {
      setCheckingLimit(false);
    }
  };

  const handleDelete = async () => {
    if (!resumeToDelete) return;
    try {
      setDeletingId(resumeToDelete);
      await resumeApi.delete(resumeToDelete);
      await invalidate(["resumes"]);
      setResumeToDelete(null);
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert("Failed to delete resume. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (resumeId: string) => {
    try {
      setDuplicatingId(resumeId);
      await resumeApi.duplicate(resumeId);
      await invalidate(["resumes"]);
    } catch (error) {
      console.error("Error duplicating resume:", error);
      alert("Failed to duplicate resume. Please try again.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleSendToChrome = async (resumeId: string) => {
    const listed = resumes.find((r) => r.resumeId === resumeId);
    try {
      setSendingToChromeId(resumeId);
      if (!(await pingInterviewTrixExtension())) {
        setExtensionSyncNotice("Install or enable the InterviewTrix Chrome extension, then try again.");
        return;
      }
      const jobLink = await resolveExtensionJobLink(resumeId);
      const pdfUrl = await resumeApi.downloadPDF(resumeId);
      const blob = await fetchPdfBlobFromUrl(pdfUrl);
      const result = await notifyExtensionResumeCompiled({
        resumeId,
        title: listed?.title || "Resume",
        fileName: resumePdfFilenameFromResume(listed),
        blob,
        sourceUrl: jobLink?.sourceUrl,
      });
      if (result.ok) {
        setSyncDialogVariant("synced");
        setSyncDialogOpen(true);
        setExtensionSyncNotice(`Ready in Chrome: ${resumePdfFilenameFromResume(listed)}.`);
        return;
      }
      setExtensionSyncNotice("Couldn’t send this PDF to the extension. Try opening the editor and downloading it.");
    } catch (error: any) {
      if (error.message?.includes("PDF not found") || error.response?.status === 404) {
        router.push(`/dashboard/resumes/${resumeId}/edit?extensionSync=1`);
        return;
      }
      console.error("Error sending resume to Chrome extension:", error);
      setExtensionSyncNotice("Failed to send this resume. Open it in the editor to compile a PDF.");
    } finally {
      setSendingToChromeId(null);
    }
  };

  const downloadPdf = async (resumeId: string) => {
    try {
      setDownloadingId(resumeId);
      const pdfUrl = await resumeApi.downloadPDF(resumeId);
      await downloadPdfFromUrl(pdfUrl, resumePdfFilenameFromResume(resumes.find((r) => r.resumeId === resumeId)));
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      if (error.response?.status === 403 && error.response?.data?.gate) {
        setTrialUpsellOpen(true);
        return;
      }
      if (error.message?.includes("PDF not found") || error.response?.status === 404) {
        if (confirm("PDF not generated yet. Would you like to open the editor to download?")) {
          window.location.href = `/dashboard/resumes/${resumeId}/edit`;
        }
      } else {
        alert("Failed to download PDF. Please try again.");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownload = async (resumeId: string) => {
    if (!canUse("resumeDownload")) {
      setTrialUpsellOpen(true);
      return;
    }
    const issues = await fetchResumePlaceholderIssues(resumes.find((r) => r.resumeId === resumeId)?.content);
    if (issues.length > 0 || shouldShowReviewReminder(resumeId)) {
      setPlaceholderCheck({ resumeId, issues });
      return;
    }
    await downloadPdf(resumeId);
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  const scored = resumes.filter(hasAts);
  const avgAts = scored.length ? Math.round(scored.reduce((s, r) => s + (r.atsScore ?? 0), 0) / scored.length) : null;
  const ready = resumes.filter((r) => (r.atsScore ?? 0) >= 80).length;
  const best = [...scored].sort((a, b) => (b.atsScore ?? 0) - (a.atsScore ?? 0))[0];
  const latest = [...resumes].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0];
  // the hero fan shows the person's own most recent templates, falling back to popular ones
  const fan = [...new Set([...resumes].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).map((r) => r.templateId))]
    .map((id) => templateById.get(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .concat(starterTemplates)
    .filter((t, i, all) => all.findIndex((x) => x.id === t.id) === i)
    .slice(0, 3);
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.55, ease: EASE },
  });
  const busyCreate = checkingLimit;

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6")}>
      {/* ── Hero: one clear way in, plus the state of the person's resumes */}
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_10%_0%,rgba(115,103,240,.14),transparent_70%),radial-gradient(40%_60%_at_95%_30%,rgba(31,143,255,.10),transparent_70%)]" />
        <div className="relative grid items-center gap-8 p-6 md:p-9 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <motion.div {...rise(0)}><Eyebrow>AI RESUME BUILDER</Eyebrow></motion.div>
            <motion.h1 {...rise(0.08)} className="text-balance mt-5 text-[32px] font-black leading-[1.03] tracking-[-0.05em] text-foreground sm:text-[42px] xl:text-[50px]">
              One resume per job.{" "}
              <span className="bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] bg-clip-text text-transparent">Each one past the bots.</span>
            </motion.h1>
            <motion.p {...rise(0.16)} className="text-balance mt-4 max-w-[56ch] text-[15.5px] leading-relaxed text-muted-foreground md:text-[17px]">
              Pick a template, bring in your LinkedIn or an old CV, and paste the job you&apos;re applying for. You get a tailored draft and an ATS score to push past 80.
            </motion.p>
            <motion.div {...rise(0.24)} className="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:gap-3">
              <Button onClick={() => createResume()} disabled={busyCreate} className="h-11 rounded-xl px-3 text-[14px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90 sm:px-5 sm:text-[14.5px]">
                {busyCreate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                New resume
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl px-3 text-[14px] sm:px-5 sm:text-[14.5px]">
                <Link href="/dashboard/ats-checker">
                  <FileSearch className="h-4 w-4" />
                  <span className="sm:hidden">Check ATS score</span>
                  <span className="hidden sm:inline">Check an ATS score</span>
                </Link>
              </Button>
            </motion.div>
            {latest && (
              <motion.p {...rise(0.3)} className="mt-4 text-[13.5px] text-muted-foreground">
                Or pick up where you left off:{" "}
                <Link href={`/dashboard/resumes/${latest.resumeId}/edit`} className="inline-flex max-w-full items-center gap-1 font-medium text-foreground underline decoration-primary/40 underline-offset-4 hover:text-primary">
                  <span className="truncate">{latest.title}</span> <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              </motion.p>
            )}
          </div>

          {/* fanned pages: the templates this person actually uses */}
          <div className="relative mx-auto hidden h-[300px] w-full max-w-[360px] lg:block" aria-hidden>
            {fan.map((t, i) => {
              const pose = [
                { rotate: -8, x: -70, y: 20 },
                { rotate: 6, x: 70, y: 24 },
                { rotate: 0, x: 0, y: 0 },
              ][i];
              return (
                <motion.div
                  key={t.id}
                  className="absolute left-1/2 top-0 -ml-[85px] w-[170px]"
                  style={{ zIndex: i === 2 ? 3 : 1 }}
                  initial={reduce ? false : { opacity: 0, y: 30, rotate: 0, x: 0 }}
                  animate={{ opacity: 1, ...pose }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.8, ease: EASE }}
                >
                  <Paper src={t.thumbnail} alt={t.name} className={i === 2 ? "shadow-[0_30px_60px_-30px_rgba(47,43,61,.7)]" : "opacity-90"} />
                </motion.div>
              );
            })}
            {best && (
              <motion.div {...rise(0.7)} className="absolute bottom-0 right-2 z-10 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-[0_20px_40px_-24px_rgba(47,43,61,.6)] backdrop-blur">
                <Mono className="text-[10.5px] text-muted-foreground">YOUR BEST ATS</Mono>
                <p className="text-[26px] font-black leading-none tracking-[-0.04em] text-foreground tabular-nums">{Math.round(best.atsScore!)}<span className="ml-1 text-[13px] font-medium tracking-normal text-muted-foreground">/100</span></p>
                <p className="mt-1 max-w-[160px] truncate text-[11.5px] text-muted-foreground">{best.title}</p>
              </motion.div>
            )}
          </div>
        </div>

        <motion.div {...rise(0.32)} className="relative grid grid-cols-2 border-t border-border md:grid-cols-4 md:divide-x md:divide-border [&>*:nth-child(-n+2)]:max-md:border-b [&>*:nth-child(odd)]:max-md:border-r">
          {[
            ["Resumes", String(resumes.length), "in your library"],
            ["Average ATS", avgAts != null ? String(avgAts) : "—", avgAts != null ? `${scored.length} scored, out of 100` : "run a check to see it"],
            ["ATS ready", String(ready), "scoring 80 or more"],
            ["PDF ready", String(resumes.filter((r) => r.pdfS3Key).length), "ready to send"],
          ].map(([k, v, d]) => (
            <div key={k} className="border-border px-5 py-4 md:px-6">
              <p className="text-[12.5px] text-muted-foreground">{k}</p>
              <Mono className="mt-1 block text-[24px] tracking-tight text-foreground">{v}</Mono>
              <p className="text-[11.5px] text-muted-foreground/80">{d}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Start from a template */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <Eyebrow>START FROM A TEMPLATE</Eyebrow>
            <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.035em] text-foreground md:text-[26px]">Pick a look, we&apos;ll do the rest.</h2>
          </div>
          <button type="button" onClick={() => createResume()} disabled={busyCreate} className="shrink-0 text-[13.5px] font-medium text-primary hover:underline">
            All templates →
          </button>
        </div>
        <div className="mt-2 flex snap-x gap-4 overflow-x-auto pb-3 pt-2 [mask-image:linear-gradient(90deg,#000_88%,transparent)] [scrollbar-width:thin]">
          {starterTemplates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => createResume(t.id)}
              disabled={busyCreate}
              className="group w-[156px] shrink-0 snap-start text-left focus-visible:outline-none sm:w-[172px]"
            >
              <div className="relative">
                <Paper src={t.thumbnail} alt={`${t.name} template`} className="transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/50 group-focus-visible:ring-2 group-focus-visible:ring-primary/40" />
                <span className="absolute inset-x-3 bottom-3 translate-y-1 rounded-lg bg-primary py-1.5 text-center text-[12px] font-semibold text-white opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100">Use this template</span>
              </div>
              <p className="mt-2.5 flex items-center gap-1.5 text-[13.5px] font-semibold text-foreground">
                {t.name}
                {t.popular && <Mono className="rounded bg-primary/10 px-1.5 py-0.5 text-[9.5px] text-primary">POPULAR</Mono>}
              </p>
              <p className="line-clamp-1 text-[12px] text-muted-foreground">{t.shortDescription}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── The library */}
      <section className="rounded-[22px] border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow>YOUR RESUMES</Eyebrow>
            <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.035em] text-foreground">
              {resumes.length === 0 ? "Nothing here yet." : `${resumes.length} resume${resumes.length === 1 ? "" : "s"}, newest first.`}
            </h2>
            {extensionSyncNotice && <p className="mt-2 text-[13.5px] text-primary">{extensionSyncNotice}</p>}
          </div>
          {resumes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <span className="sr-only">Search resumes</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShown(PAGE); setListPage(1); }}
                  placeholder="Search by title, name or role"
                  className="h-10 w-[240px] rounded-xl border border-border bg-background pl-9 pr-8 text-[13.5px] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                />
                {query && (
                  <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                )}
              </label>
              <select
                aria-label="Sort resumes"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-[13.5px] outline-none focus:border-primary/50"
              >
                <option value="edited">Last edited</option>
                <option value="ats">Highest ATS</option>
                <option value="name">Name A–Z</option>
              </select>
              <div role="group" aria-label="View" className="flex h-10 rounded-xl border border-border bg-background p-1">
                {([["grid", LayoutGrid], ["list", List]] as const).map(([v, I]) => (
                  <button key={v} type="button" aria-label={`${v} view`} aria-pressed={view === v} onClick={() => changeView(v)}
                    className={cn("grid w-9 place-items-center rounded-lg transition-colors", view === v ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>
                    <I className="h-4 w-4" />
                  </button>
                ))}
              </div>
              <AddToChromeButton variant="outline" size="sm" />
            </div>
          )}
        </div>

        {resumes.length === 0 ? (
          <div className="grid items-center gap-8 p-6 md:grid-cols-[220px_1fr] md:p-10">
            <Paper src={starterTemplates[0]?.thumbnail} alt="" className="mx-auto w-[180px] opacity-90" />
            <div>
              <h3 className="text-[20px] font-bold tracking-tight text-foreground">Your first resume takes about five minutes.</h3>
              <p className="mt-2 max-w-[52ch] text-[14.5px] leading-relaxed text-muted-foreground">
                Import your LinkedIn or an old CV and we fill the sections in. Paste a job description and the bullets get written for that role.
              </p>
              <Button onClick={() => createResume()} disabled={busyCreate} className="mt-5 h-11 rounded-xl px-5">
                {busyCreate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create my first resume
              </Button>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[15px] font-semibold text-foreground">No resume matches “{query}”.</p>
            <button type="button" onClick={() => setQuery("")} className="mt-2 text-[13.5px] font-medium text-primary hover:underline">Clear search</button>
          </div>
        ) : view === "list" ? (
          <DashboardResumesList
            resumes={visible}
            currentPage={listPage}
            itemsPerPage={10}
            onPageChange={setListPage}
            onDownload={handleDownload}
            downloadingResumeId={downloadingId}
            onSendToChrome={handleSendToChrome}
            sendingToChromeResumeId={sendingToChromeId}
            onDuplicate={handleDuplicate}
            onDelete={setResumeToDelete}
            duplicatingResumeId={duplicatingId}
            deletingResumeId={deletingId}
            onCreateClick={() => createResume()}
            createLoading={busyCreate}
          />
        ) : (
          <div className="p-5 md:p-6">
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-5">
              {!query && (
                <button
                  type="button"
                  onClick={() => createResume()}
                  disabled={busyCreate}
                  className="group flex aspect-[1/1.3] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/[0.03] hover:text-primary"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    {busyCreate ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  </span>
                  <span className="text-[14px] font-semibold">New resume</span>
                  <span className="max-w-[24ch] text-center text-[12px]">From a template, LinkedIn or an old CV</span>
                </button>
              )}
              {visible.slice(0, shown).map((r) => (
                <ResumeCard
                  key={r.resumeId}
                  resume={r}
                  busy={downloadingId === r.resumeId || duplicatingId === r.resumeId || deletingId === r.resumeId || sendingToChromeId === r.resumeId}
                  highlightChrome={extensionSyncMode}
                  onDownload={() => handleDownload(r.resumeId)}
                  onDuplicate={() => handleDuplicate(r.resumeId)}
                  onChrome={() => handleSendToChrome(r.resumeId)}
                  onDelete={() => setResumeToDelete(r.resumeId)}
                />
              ))}
            </div>
            {visible.length > shown && (
              <div className="mt-8 text-center">
                <Button variant="outline" className="rounded-xl" onClick={() => setShown((n) => n + PAGE + 1)}>
                  Show more <Mono className="ml-1 text-muted-foreground">({visible.length - shown})</Mono>
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      <ConfirmationDialog
        open={resumeToDelete !== null}
        onOpenChange={(open) => { if (!open) setResumeToDelete(null); }}
        title="Delete Resume"
        description="Are you sure you want to delete this resume? This action cannot be undone and all data will be permanently lost."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={deletingId !== null}
      />

      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="border border-primary/20 bg-card shadow-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Resume limit reached</DialogTitle>
            <DialogDescription className="pt-1 text-left text-muted-foreground">
              You&apos;ve used all the resumes included in your current plan. Upgrade your plan to create more resumes and keep building.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 pt-4 sm:flex-row">
            <Button variant="outline" onClick={() => setShowLimitModal(false)}>Cancel</Button>
            <Button onClick={() => { setShowLimitModal(false); router.push("/dashboard/plan"); }}>
              Upgrade plan <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ExtensionSyncedDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen} variant={syncDialogVariant} />
      <PlaceholderDataDialog
        open={placeholderCheck !== null}
        onOpenChange={(open) => { if (!open) setPlaceholderCheck(null); }}
        issues={placeholderCheck?.issues ?? []}
        onEdit={() => {
          const id = placeholderCheck?.resumeId;
          setPlaceholderCheck(null);
          if (id) router.push(`/dashboard/resumes/${id}/edit`);
        }}
        onDontRemindAgain={() => dismissReviewReminder(placeholderCheck?.resumeId)}
        onDownloadAnyway={() => {
          const id = placeholderCheck?.resumeId;
          setPlaceholderCheck(null);
          if (id) void downloadPdf(id);
        }}
      />
      <TrialUpsellDialog
        open={trialUpsellOpen}
        onOpenChange={setTrialUpsellOpen}
        variant="resume_download"
        hasPurchasedTrial={entitlements ? !entitlements.canPurchaseTrial : false}
      />
    </div>
  );
}

function ResumeCard({
  resume: r,
  busy,
  highlightChrome,
  onDownload,
  onDuplicate,
  onChrome,
  onDelete,
}: {
  resume: Resume;
  busy: boolean;
  highlightChrome: boolean;
  onDownload: () => void;
  onDuplicate: () => void;
  onChrome: () => void;
  onDelete: () => void;
}) {
  const t = templateById.get(r.templateId);
  const href = `/dashboard/resumes/${r.resumeId}/edit`;
  const item = "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-foreground outline-none data-[highlighted]:bg-muted";
  return (
    <div className="group relative">
      <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        <Paper src={t?.thumbnail} alt={`${r.title} — ${t?.name ?? "resume"} template`} score={hasAts(r) ? r.atsScore : undefined} className="transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-[0_28px_50px_-30px_rgba(115,103,240,.65)]" />
        <span className="pointer-events-none absolute inset-x-0 top-0 flex aspect-[1/1.3] items-end justify-center rounded-xl bg-gradient-to-t from-black/45 via-black/0 to-transparent pb-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-900 shadow-lg"><PenLine className="h-3.5 w-3.5" />Open editor</span>
        </span>
      </Link>
      {(r.isDefault || r.pdfS3Key) && (
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex gap-1.5">
          {r.isDefault && <span className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-[10.5px] font-semibold text-amber-600 shadow-sm"><Star className="h-3 w-3 fill-current" />Default</span>}
          {r.pdfS3Key && <span className="rounded-lg bg-white/95 px-2 py-1 text-[10.5px] font-semibold text-sky-700 shadow-sm">PDF</span>}
        </div>
      )}

      <div className="mt-3 flex items-start gap-2">
        <Link href={href} className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-semibold text-foreground hover:text-primary">{r.title}</p>
          <p className="truncate text-[12.5px] text-muted-foreground">
            {t?.name ?? "Custom"} · edited {ago(r.updatedAt)}
          </p>
        </Link>
        {highlightChrome && (
          <button type="button" onClick={onChrome} disabled={busy} title="Send to Chrome extension" aria-label="Send to Chrome extension"
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
            <ChromeIcon className="h-4 w-4" />
          </button>
        )}
        <Menu.Root modal={false}>
          <Menu.Trigger asChild>
            <button type="button" aria-label={`Actions for ${r.title}`} disabled={busy}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            </button>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content align="end" sideOffset={6} className={cn(dash2026Scope, "z-50 min-w-[200px] rounded-xl border border-border bg-card p-1.5 shadow-[0_20px_50px_-20px_rgba(30,20,90,.45)]")}>
              <Menu.Item asChild className={item}><Link href={href}><PenLine className="h-4 w-4 text-muted-foreground" />Open editor</Link></Menu.Item>
              <Menu.Item className={item} onSelect={onDownload}><Download className="h-4 w-4 text-muted-foreground" />Download PDF</Menu.Item>
              <Menu.Item className={item} onSelect={onChrome}><ChromeIcon className="h-4 w-4" />Send to Chrome</Menu.Item>
              <Menu.Item className={item} onSelect={onDuplicate}><Copy className="h-4 w-4 text-muted-foreground" />Duplicate</Menu.Item>
              <Menu.Separator className="my-1 h-px bg-border" />
              <Menu.Item className={cn(item, "text-rose-600 data-[highlighted]:bg-rose-500/10")} onSelect={onDelete}><Trash2 className="h-4 w-4" />Delete</Menu.Item>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      </div>
    </div>
  );
}
