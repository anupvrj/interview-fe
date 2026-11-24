"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { isAxiosError } from "axios";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, CloudUpload, Download, FileText, Loader2, Lock, PenLine, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mono } from "@/components/marketing-2026/primitives";
import { GridRunners } from "@/components/marketing-2026/graphics";
import { HL, INK, ease } from "@/components/marketing-2026/landing-kit";
import { TemplatePreview } from "@/components/TemplatePreview";
import { atsGuestApi, resumeApi, type ResumeTemplate } from "@/lib/api";
import { track } from "@/lib/analytics/productEvents";
import {
  GUEST_DRAFT_SIGN_UP_HREF,
  forgetGuestResumeDraft,
  loadGuestResumeDraft,
  saveGuestResumeDraft,
  type GuestResumeSource,
} from "@/lib/guestResumeDraft";
import { cn } from "@/lib/utils";
import { ResumeTemplatePreview } from "./ResumeTemplatePreview";

const DEFAULT_TEMPLATE = "condensed-rule";
const MAX_PDF_BYTES = 2 * 1024 * 1024;
/** Enough to choose from without turning the page into a catalogue. */
const MAX_TEMPLATES = 8;

type Step = "start" | "basics" | "reading" | "preview";
type Basics = { fullName: string; portfolio: string; email: string; phone: string; location: string };
const EMPTY_BASICS: Basics = { fullName: "", portfolio: "", email: "", phone: "", location: "" };
const BASIC_FIELDS: { key: keyof Basics; label: string; type?: string; autoComplete: string }[] = [
  { key: "fullName", label: "Full name", autoComplete: "name" },
  { key: "portfolio", label: "Job title you want", autoComplete: "organization-title" },
  { key: "email", label: "Email", type: "email", autoComplete: "email" },
  { key: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { key: "location", label: "City", autoComplete: "address-level2" },
];

/** The template's example values ("your.email@example.com"): shown as empty fields, not as theirs. */
const SAMPLE_VALUE = /example\.(com|org|net)|^your\b|^sample\b|0{5}|^\+?0+[\s0]*$/i;

function basicsOf(content: Record<string, unknown> | null): Basics {
  const info = (content?.personalInfo ?? {}) as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === "string" && !SAMPLE_VALUE.test(v.trim()) ? v : "");
  return { fullName: s(info.fullName), portfolio: s(info.portfolio), email: s(info.email), phone: s(info.phone), location: s(info.location) };
}

function withBasics(content: Record<string, unknown>, basics: Partial<Basics>): Record<string, unknown> {
  const info = { ...((content.personalInfo ?? {}) as Record<string, unknown>) };
  for (const [k, v] of Object.entries(basics)) if (typeof v === "string" && v.trim()) info[k] = v.trim();
  return { ...content, personalInfo: info };
}

function uploadErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    if (err.response?.status === 429) return "You've read a few resumes in a short time. Please wait a little and try again, or start from scratch.";
    if (err.response?.status === 403) return "Reading resumes is switched off right now. Please start from scratch.";
  }
  if (err instanceof Error && /text|scanned|empty/i.test(err.message)) {
    return "We couldn't read text from this PDF (it may be a scanned image). Try another file or start from scratch.";
  }
  return "We couldn't read this resume. Try another PDF or start from scratch.";
}

/**
 * The public resume builder: start from your PDF or a few basics, try templates on your own
 * resume, and sign up only to keep editing or download. Everything stays in this browser
 * until then (see guestResumeDraft.ts); after sign-up it becomes a resume in the account.
 */
export function GuestResumeBuilder() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [step, setStep] = useState<Step>("start");
  const [source, setSource] = useState<GuestResumeSource>("scratch");
  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const [sectionOrder, setSectionOrder] = useState<unknown[]>([]);
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE);
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [basics, setBasics] = useState<Basics>(EMPTY_BASICS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const opened = useRef(false);
  const reduce = useReducedMotion();

  // Signed in already: the dashboard builder does all of this and saves as you go.
  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace("/dashboard/resumes/new");
  }, [isLoaded, isSignedIn, router]);

  // Coming back (refresh, or back from sign-up without finishing): pick up where they were.
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    const draft = loadGuestResumeDraft();
    track("resume_builder_opened", { surface: "guest", signed_in: false });
    if (draft) {
      setContent(draft.content);
      setSectionOrder(draft.sectionOrder);
      setTemplateId(draft.templateId);
      setSource(draft.source);
      setBasics(basicsOf(draft.content));
      setStep("preview");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    resumeApi
      .getSelectableTemplates()
      .then((all) => {
        if (cancelled) return;
        const first = all.find((t) => t.id === DEFAULT_TEMPLATE);
        setTemplates([...(first ? [first] : []), ...all.filter((t) => t.id !== DEFAULT_TEMPLATE)].slice(0, MAX_TEMPLATES));
      })
      .catch(() => setTemplates([]));
    return () => {
      cancelled = true;
    };
  }, []);

  // Each step starts at the top of the page (the previous one may have been scrolled).
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [step, reduce]);

  // Keep the draft as it changes, so a refresh or the trip to sign-up loses nothing.
  useEffect(() => {
    if (step !== "preview" || !content) return;
    saveGuestResumeDraft({ templateId, content, sectionOrder, source });
  }, [step, content, sectionOrder, templateId, source]);

  const startFromPdf = useCallback(async (file: File) => {
    setError(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError("This PDF is over 2 MB. Please choose a smaller file.");
      return;
    }
    track("resume_creation_started", { source: "guest_pdf" });
    setStep("reading");
    try {
      const [{ extractTextFromPDF }, importer] = await Promise.all([import("@/lib/pdf-utils"), import("@/lib/resume-data-import")]);
      const text = (await extractTextFromPDF(file)).trim();
      if (text.length < 80) throw new Error("No text in this PDF (scanned or empty)");
      const sections = await atsGuestApi.extractSections(text);
      const mapped = importer.mapExtractedSectionsToContent(sections);
      const order = await importer.sectionOrderForExtractedContent(templateId, mapped);
      setContent(mapped);
      setSectionOrder(order);
      setBasics(basicsOf(mapped));
      setSource("pdf");
      setStep("preview");
    } catch (err) {
      setError(uploadErrorMessage(err));
      setStep("start");
    }
  }, [templateId]);

  const startFromBasics = async () => {
    if (!basics.fullName.trim()) {
      setError("Please add your name.");
      return;
    }
    setError(null);
    setBusy(true);
    track("resume_creation_started", { source: "guest_scratch" });
    try {
      const [{ TemplateLoader }, { normalizeResumeImportContent }, { buildResumeTemplateApplication }] = await Promise.all([
        import("@/lib/templateLoader"),
        import("@/lib/resume-data-import"),
        import("@/lib/applyResumeTemplate"),
      ]);
      // The template's example content, so they see a full page; the editor marks every
      // example line until it's replaced (sample text can't reach a download unnoticed).
      const sample = (await TemplateLoader.loadDummyContent(templateId)) ?? (await TemplateLoader.loadDummyContent(DEFAULT_TEMPLATE)) ?? {};
      const started = withBasics(normalizeResumeImportContent(sample as Record<string, unknown>) as Record<string, unknown>, basics);
      const application = await buildResumeTemplateApplication(templateId, { content: started } as never);
      setContent(started);
      setSectionOrder(application.sectionOrder);
      setSource("scratch");
      setStep("preview");
    } catch {
      setError("Something went wrong starting your resume. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const updateBasic = (key: keyof Basics, value: string) => {
    setBasics((b) => ({ ...b, [key]: value }));
    if (content) setContent((c) => (c ? withBasics(c, { [key]: value }) : c));
  };

  const startOver = () => {
    forgetGuestResumeDraft();
    setContent(null);
    setSectionOrder([]);
    setBasics(EMPTY_BASICS);
    setError(null);
    setStep("start");
  };

  const goSignUp = (placement: "save" | "download") => {
    if (content) saveGuestResumeDraft({ templateId, content, sectionOrder, source });
    track("resume_guest_signup_clicked", { placement, source, template_id: templateId });
  };

  const templateName = useMemo(() => templates.find((t) => t.id === templateId)?.name ?? "this design", [templates, templateId]);

  if (isLoaded && isSignedIn) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="relative overflow-clip pb-20 pt-28 md:pb-28 md:pt-36 lg:pt-40">
      {/* the same light, glow and moving grid as the ATS checker hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_78%_35%,rgba(115,103,240,.18),transparent_70%),radial-gradient(30%_40%_at_95%_10%,rgba(31,143,255,.12),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_70%)]"
      />
      <GridRunners />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-5">
        {error && (
          <p role="alert" className="mx-auto mb-6 max-w-[720px] rounded-2xl border border-destructive/30 bg-white/90 px-4 py-3 text-[14px] text-destructive shadow-sm lg:mx-0">
            {error}
          </p>
        )}

        {step === "preview" && content ? (
          <PreviewStep
            source={source}
            content={content}
            sectionOrder={sectionOrder}
            templateId={templateId}
            templateName={templateName}
            templates={templates}
            basics={basics}
            onPickTemplate={(id) => {
              setTemplateId(id);
              track("resume_template_selected", { template_id: id, surface: "guest_builder" });
            }}
            onBasic={updateBasic}
            onSignUp={goSignUp}
            onStartOver={startOver}
          />
        ) : (
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <Rise delay={0}>
                <ProductBadge />
              </Rise>
              <Rise delay={0.08}>
                <h1 className={cn("mt-6 text-[38px] font-black leading-[1] tracking-[-0.055em] sm:text-[48px] md:mt-7 md:text-[60px] xl:text-[66px]", INK)}>
                  {step === "basics" ? (
                    <>Start with <span className={HL}>the basics</span></>
                  ) : step === "reading" ? (
                    <>Reading <span className={HL}>your resume</span></>
                  ) : (
                    <>Build a resume that <span className={HL}>gets read</span></>
                  )}
                </h1>
              </Rise>
              <Rise delay={0.16}>
                <p className="mt-5 max-w-[50ch] text-[16.5px] leading-relaxed text-[#4B5275] md:mt-7 md:text-[18.5px]">
                  {step === "basics"
                    ? "Five quick details. We lay out the rest in an ATS-friendly design for you to fill in."
                    : step === "reading"
                      ? "We're putting your PDF into a clean, editable design. Usually under a minute."
                      : "Upload your PDF or start from scratch, then try it in ATS-friendly designs. No sign-up until you want to save or download."}
                </p>
              </Rise>

              <Rise delay={0.24} className="mt-8">
                {step === "start" && (
                  <StartChoices
                    onUpload={() => fileInput.current?.click()}
                    onScratch={() => {
                      setError(null);
                      setStep("basics");
                    }}
                  />
                )}
                {step === "basics" && (
                  <BasicsForm
                    basics={basics}
                    busy={busy}
                    onChange={(key, value) => setBasics((b) => ({ ...b, [key]: value }))}
                    onBack={() => setStep("start")}
                    onSubmit={() => void startFromBasics()}
                  />
                )}
                {step === "reading" && <ReadingCard />}
              </Rise>

              <input
                ref={fileInput}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                aria-label="Upload your resume (PDF)"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void startFromPdf(file);
                }}
              />

              {step === "start" && (
                <Rise delay={0.32} className="mt-7 space-y-4">
                  <p className="flex items-start gap-1.5 text-[13px] text-muted-foreground">
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Free to start. Your resume stays in this browser until you sign up.
                  </p>
                  <ul className="flex flex-wrap gap-2" aria-label="What you get">
                    {["ATS-friendly designs", "Edit every line", "Free Word download", "ATS check built in"].map((t) => (
                      <li key={t} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#2E3656] sm:text-[13px]">
                        <Check className="h-3.5 w-3.5 text-primary" />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[13px] text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/sign-in?redirect_url=%2Fdashboard%2Fresumes%2Fnew" className="font-semibold text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </Rise>
              )}
            </div>

            {/* wide screens: a fan of real designs, so the promise is visible */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.9, ease }}
              className="hidden lg:block lg:pl-6"
              aria-hidden
            >
              <TemplateFan templates={templates} />
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────── pieces ─────────────── */

function Rise({ delay, className, children }: { delay: number; className?: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.65, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ProductBadge() {
  return (
    <div className="inline-flex max-w-full items-center gap-3 rounded-2xl border border-white bg-white/80 py-2 pl-2 pr-4 shadow-[0_14px_34px_-18px_rgba(75,63,208,.55),inset_0_1px_0_#fff] backdrop-blur">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7367F0] to-[#1FB6FF] text-white shadow-[0_8px_18px_-6px_rgba(115,103,240,.8)]">
        <FileText className="size-5" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className={cn("block text-[16px] font-extrabold tracking-[-0.02em] sm:text-[17px]", INK)}>AI Resume Builder</span>
        <Mono className="block text-[10.5px] text-muted-foreground sm:hidden">PDF OR SCRATCH · NO SIGN-UP</Mono>
        <Mono className="hidden text-[11px] text-muted-foreground sm:block">PDF OR SCRATCH · ATS-FRIENDLY · NO SIGN-UP TO START</Mono>
      </span>
    </div>
  );
}

function ChoiceCard({
  icon,
  title,
  body,
  meta,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  meta: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-start gap-4 rounded-[20px] border bg-white/90 p-4 text-left shadow-[0_18px_40px_-28px_rgba(47,43,61,.45)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-26px_rgba(75,63,208,.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-col sm:gap-0 sm:p-5",
        primary ? "border-primary/30 hover:border-primary/60" : "border-border hover:border-primary/40",
      )}
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl text-white shadow-[0_8px_18px_-6px_rgba(115,103,240,.8)]",
          primary ? "bg-gradient-to-br from-[#7367F0] to-[#1FB6FF]" : "bg-gradient-to-br from-[#8E83F5] to-[#5AA8FF]",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 sm:mt-4">
        <span className="flex items-center justify-between gap-2">
          <span className={cn("text-[16.5px] font-bold tracking-[-0.02em]", INK)}>{title}</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
        </span>
        <span className="mt-1 block text-[13.5px] leading-snug text-[#4B5275]">{body}</span>
        <Mono className="mt-3 block text-[10.5px] text-muted-foreground">{meta}</Mono>
      </span>
    </button>
  );
}

function StartChoices({ onUpload, onScratch }: { onUpload: () => void; onScratch: () => void }) {
  return (
    <div className="grid max-w-[620px] gap-3 sm:grid-cols-2 sm:gap-4">
      <ChoiceCard primary icon={<CloudUpload className="size-5" />} title="Upload my resume" body="We put your PDF into a clean, editable design." meta="PDF · UP TO 2 MB" onClick={onUpload} />
      <ChoiceCard icon={<PenLine className="size-5" />} title="Start from scratch" body="Add five details and we lay out the rest for you." meta="ABOUT 1 MINUTE" onClick={onScratch} />
    </div>
  );
}

function BasicsForm({
  basics,
  busy,
  onChange,
  onBack,
  onSubmit,
}: {
  basics: Basics;
  busy: boolean;
  onChange: (key: keyof Basics, value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="max-w-[560px] rounded-[22px] border border-border bg-white/90 p-5 shadow-[0_24px_50px_-30px_rgba(47,43,61,.45)] backdrop-blur sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {BASIC_FIELDS.map((f) => (
          <label key={f.key} className={cn("block", (f.key === "fullName" || f.key === "portfolio") && "sm:col-span-2")}>
            <span className="text-[13px] font-medium text-[#2E3656]">
              {f.label}
              {f.key === "fullName" && <span className="text-destructive"> *</span>}
            </span>
            <input
              type={f.type ?? "text"}
              autoComplete={f.autoComplete}
              value={basics[f.key]}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-[15px] text-foreground outline-none transition-shadow focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>
        ))}
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onBack} className="inline-flex items-center justify-center gap-1 text-[13.5px] font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl px-6 text-[15px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90 sm:w-auto">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          See my resume
        </Button>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Lock className="h-3 w-3 shrink-0" /> Saved only in this browser until you sign up.
      </p>
    </form>
  );
}

const READING_STEPS = ["Reading the text", "Finding your sections", "Laying out the design"];

function ReadingCard() {
  const reduce = useReducedMotion();
  const [at, setAt] = useState(0);
  useEffect(() => {
    // honest pacing: moves on through the stages, then waits on the last until it's done
    const t = window.setInterval(() => setAt((i) => Math.min(i + 1, READING_STEPS.length - 1)), 4000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div role="status" className="max-w-[560px] rounded-[22px] border border-border bg-white/90 p-5 shadow-[0_24px_50px_-30px_rgba(47,43,61,.45)] backdrop-blur sm:p-6">
      <ol className="space-y-3">
        {READING_STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-3">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full border text-[12px] font-semibold",
                i < at && "border-primary bg-primary text-white",
                i === at && "border-primary/50 text-primary",
                i > at && "border-border text-muted-foreground",
              )}
            >
              {i < at ? <Check className="h-3.5 w-3.5" /> : i === at && !reduce ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : i + 1}
            </span>
            <span className={cn("text-[15px]", i <= at ? "font-medium text-[#2E3656]" : "text-muted-foreground")}>{label}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[12.5px] text-muted-foreground">Keep this tab open.</p>
    </div>
  );
}

/** Three real designs, fanned, with a soft glow: what they'll get. */
function TemplateFan({ templates }: { templates: ResumeTemplate[] }) {
  const shown = templates.slice(0, 3);
  if (shown.length === 0) return <div className="aspect-[4/3]" />;
  const pose = ["-rotate-6 -translate-x-16 translate-y-6", "z-10", "rotate-6 translate-x-16 translate-y-6"];
  return (
    <div className="relative mx-auto aspect-[4/3.4] max-w-[520px]">
      <div className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(115,103,240,.28),transparent_70%)] blur-2xl" />
      <div className="absolute inset-0 flex items-center justify-center">
        {shown.map((t, i) => (
          <div
            key={t.id}
            className={cn(
              "absolute w-[46%] overflow-hidden rounded-xl bg-white p-1.5 shadow-[0_30px_60px_-24px_rgba(30,20,90,.45)] ring-1 ring-black/5",
              pose[i] ?? "",
            )}
          >
            <TemplatePreview template={t} isSelected={false} variant="thumb" />
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white bg-white/90 px-3.5 py-1.5 shadow-[0_14px_34px_-18px_rgba(75,63,208,.55)] backdrop-blur">
        <span className="size-2 rounded-full bg-emerald-500" />
        <Mono className="text-[11px] text-[#2E3656]">ATS-FRIENDLY DESIGNS</Mono>
      </div>
    </div>
  );
}

function PreviewStep({
  source,
  content,
  sectionOrder,
  templateId,
  templateName,
  templates,
  basics,
  onPickTemplate,
  onBasic,
  onSignUp,
  onStartOver,
}: {
  source: GuestResumeSource;
  content: Record<string, unknown>;
  sectionOrder: unknown[];
  templateId: string;
  templateName: string;
  templates: ResumeTemplate[];
  basics: Basics;
  onPickTemplate: (id: string) => void;
  onBasic: (key: keyof Basics, value: string) => void;
  onSignUp: (placement: "save" | "download") => void;
  onStartOver: () => void;
}) {
  const actions = (
    <>
      <Button asChild className="h-12 rounded-xl px-6 text-[15px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90">
        <Link href={GUEST_DRAFT_SIGN_UP_HREF} onClick={() => onSignUp("save")}>
          Save and keep editing, free <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant="outline" className="h-12 rounded-xl border-border bg-white px-5 text-[15px] text-[#2E3656] hover:bg-white hover:text-primary">
        <Link href={GUEST_DRAFT_SIGN_UP_HREF} onClick={() => onSignUp("download")}>
          <Download className="h-4 w-4" /> Download PDF or Word
        </Link>
      </Button>
    </>
  );

  return (
    <div className="pb-24 lg:pb-0">
      {/* header: what this is and what to do next */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <Rise delay={0} className="min-w-0">
          <Mono className="text-[11px] text-primary">— YOUR RESUME —</Mono>
          <h1 className={cn("mt-3 text-[32px] font-black leading-[1.02] tracking-[-0.05em] sm:text-[40px] md:text-[48px]", INK)}>
            {source === "pdf" ? (
              <>Your resume, in a <span className={HL}>clean design</span></>
            ) : (
              <>Your resume <span className={HL}>is started</span></>
            )}
          </h1>
          <p className="mt-3 max-w-[56ch] text-[15.5px] leading-relaxed text-[#4B5275] md:text-[17px]">
            Sign up free to keep editing every line, check it against ATS software and download it as PDF or Word.
          </p>
        </Rise>
        <Rise delay={0.1} className="hidden shrink-0 flex-col gap-2 sm:flex sm:flex-row lg:flex-col xl:flex-row">
          {actions}
        </Rise>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* the resume, on the same glow as the rest of the page */}
        <Rise delay={0.15} className="min-w-0">
          <div
            className="relative rounded-[24px] border border-white bg-[radial-gradient(60%_50%_at_50%_0%,rgba(115,103,240,.16),transparent_75%),linear-gradient(180deg,#F4F3FF_0%,#EEF4FF_100%)] p-3 shadow-[0_30px_60px_-36px_rgba(30,20,90,.45)] sm:p-6 md:p-8"
            aria-label={`Your resume in ${templateName}`}
          >
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white bg-white/80 px-3 py-1 text-[12.5px] font-medium text-[#2E3656] shadow-sm">
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="truncate">{templateName}</span>
              </span>
              <Mono className="shrink-0 text-[10.5px] text-muted-foreground">PREVIEW</Mono>
            </div>
            <div className="drop-shadow-[0_30px_40px_rgba(30,20,90,.18)]">
              <ResumeTemplatePreview templateId={templateId} content={content} sectionOrder={sectionOrder} />
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-muted-foreground">
              <FileText className="h-3.5 w-3.5 shrink-0" /> Every line is editable after you sign up.
            </p>
          </div>
        </Rise>

        <Rise delay={0.2} className="min-w-0">
          <aside className="space-y-5 lg:sticky lg:top-24" aria-label="Design and details">
            <section className="rounded-[22px] border border-border bg-white/90 p-4 shadow-[0_18px_40px_-30px_rgba(47,43,61,.45)] backdrop-blur sm:p-5" aria-labelledby="gb-design">
              <div className="flex items-baseline justify-between gap-3">
                <Mono id="gb-design" className="text-[11px] text-primary">— DESIGN —</Mono>
                <Mono className="text-[10.5px] text-muted-foreground">{templates.length || "…"} TO TRY</Mono>
              </div>
              {templates.length === 0 ? (
                <div className="mt-3 flex gap-2.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="aspect-[210/297] w-[30%] animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : (
                // phones: one swipeable row; wider: a roomy grid
                <ul
                  className="-mx-4 mt-2 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-3"
                  role="listbox"
                  aria-label="Resume designs"
                >
                  {templates.map((t) => {
                    const on = t.id === templateId;
                    return (
                      <li key={t.id} className="w-[30%] min-w-[96px] shrink-0 snap-start sm:w-auto sm:min-w-0">
                        <button
                          type="button"
                          role="option"
                          aria-selected={on}
                          aria-label={t.name}
                          title={t.name}
                          onClick={() => onPickTemplate(t.id)}
                          className={cn(
                            "block w-full rounded-xl p-1 ring-2 transition",
                            on ? "bg-primary/5 ring-primary" : "ring-transparent hover:ring-primary/30",
                          )}
                        >
                          <TemplatePreview template={t} isSelected={on} variant="thumb" />
                          <span className={cn("mt-1 block truncate px-0.5 text-[11.5px]", on ? "font-semibold text-primary" : "text-[#4B5275]")}>{t.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-[22px] border border-border bg-white/90 p-4 shadow-[0_18px_40px_-30px_rgba(47,43,61,.45)] backdrop-blur sm:p-5" aria-labelledby="gb-details">
              <Mono id="gb-details" className="text-[11px] text-primary">— YOUR DETAILS —</Mono>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {BASIC_FIELDS.map((f) => (
                  <label key={f.key} className="block">
                    <span className="text-[12.5px] text-muted-foreground">{f.label}</span>
                    <input
                      type={f.type ?? "text"}
                      autoComplete={f.autoComplete}
                      value={basics[f.key]}
                      onChange={(e) => onBasic(f.key, e.target.value)}
                      className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 text-[15px] text-foreground outline-none transition-shadow focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30 lg:h-10 lg:text-[14px]"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-[12px] text-muted-foreground">
                <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  {source === "scratch" ? "Example lines are marked in the editor so you can replace them. " : ""}
                  Saved only in this browser until you sign up.
                </span>
              </p>
            </section>

            <button type="button" onClick={onStartOver} className="inline-flex items-center gap-1.5 px-1 text-[13px] text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Start over
            </button>
          </aside>
        </Rise>
      </div>

      {/* phones: the main action stays in reach */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-12px_30px_-20px_rgba(47,43,61,.5)] backdrop-blur sm:hidden">
        <Button asChild className="h-12 w-full rounded-xl text-[15px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90">
          <Link href={GUEST_DRAFT_SIGN_UP_HREF} onClick={() => onSignUp("save")}>
            Save and keep editing, free <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Link
          href={GUEST_DRAFT_SIGN_UP_HREF}
          onClick={() => onSignUp("download")}
          className="mt-2 flex items-center justify-center gap-1.5 text-[13px] font-medium text-[#4B5275]"
        >
          <Download className="h-3.5 w-3.5" /> Download PDF or Word
        </Link>
      </div>
    </div>
  );
}
