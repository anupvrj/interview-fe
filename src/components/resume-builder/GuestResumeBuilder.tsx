"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { isAxiosError } from "axios";
import { ArrowLeft, ArrowRight, CloudUpload, Download, FileText, Loader2, PenLine, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mono } from "@/components/marketing-2026/primitives";
import { Eyebrow, dash2026Scope } from "@/components/dashboard-2026/ui";
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-[1200px] px-4 pb-24 pt-28 sm:px-6 lg:pt-32")}>
      {step !== "preview" && (
        <div className="mx-auto max-w-[640px] text-center">
          <Eyebrow>AI RESUME BUILDER</Eyebrow>
          <h1 className="mt-4 text-[34px] font-black leading-[1.05] tracking-[-0.05em] text-foreground sm:text-[46px]">
            Build your resume,{" "}
            <span className="bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] bg-clip-text text-transparent">free</span>
          </h1>
          <p className="mt-3 text-[16px] text-muted-foreground">See it in our templates first. Sign up only when you want to save or download.</p>
        </div>
      )}

      {error && (
        <p role="alert" className="mx-auto mt-6 max-w-[640px] rounded-[16px] border border-destructive/30 bg-destructive/[0.06] px-4 py-3 text-[14px] text-destructive">
          {error}
        </p>
      )}

      {step === "start" && (
        <div className="mx-auto mt-8 grid max-w-[720px] gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="group rounded-[22px] border border-border bg-card p-6 text-left transition-colors hover:border-primary/50 hover:bg-primary/[0.03]"
          >
            <CloudUpload className="h-6 w-6 text-primary" />
            <p className="mt-4 text-[17px] font-semibold text-foreground">Upload my resume</p>
            <p className="mt-1 text-[14px] text-muted-foreground">We&apos;ll put your PDF into a clean, editable design.</p>
            <Mono className="mt-4 block text-[11px] text-muted-foreground">PDF · UP TO 2 MB</Mono>
          </button>
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
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep("basics");
            }}
            className="group rounded-[22px] border border-border bg-card p-6 text-left transition-colors hover:border-primary/50 hover:bg-primary/[0.03]"
          >
            <PenLine className="h-6 w-6 text-primary" />
            <p className="mt-4 text-[17px] font-semibold text-foreground">Start from scratch</p>
            <p className="mt-1 text-[14px] text-muted-foreground">Add a few details and we&apos;ll lay out the rest for you to fill in.</p>
            <Mono className="mt-4 block text-[11px] text-muted-foreground">ABOUT 1 MINUTE</Mono>
          </button>
          <p className="text-center text-[12.5px] text-muted-foreground sm:col-span-2">
            Already have an account? <Link href="/sign-in?redirect_url=%2Fdashboard%2Fresumes%2Fnew" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      )}

      {step === "basics" && (
        <form
          className="mx-auto mt-8 max-w-[520px] space-y-4 rounded-[22px] border border-border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            void startFromBasics();
          }}
        >
          {BASIC_FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-[13px] font-medium text-foreground">
                {f.label}
                {f.key === "fullName" && <span className="text-destructive"> *</span>}
              </span>
              <input
                type={f.type ?? "text"}
                autoComplete={f.autoComplete}
                value={basics[f.key]}
                onChange={(e) => setBasics((b) => ({ ...b, [f.key]: e.target.value }))}
                className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-[14px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          ))}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button type="button" onClick={() => setStep("start")} className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <Button type="submit" disabled={busy} className="h-11 rounded-xl px-5 shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              See my resume <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[12px] text-muted-foreground">Saved only in this browser until you sign up.</p>
        </form>
      )}

      {step === "reading" && (
        <div className="mx-auto mt-10 flex max-w-[520px] flex-col items-center gap-3 rounded-[22px] border border-border bg-card p-10 text-center" role="status">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-[16px] font-semibold text-foreground">Reading your resume…</p>
          <p className="text-[13.5px] text-muted-foreground">Usually under a minute. Keep this tab open.</p>
        </div>
      )}

      {step === "preview" && content && (
        // Phones: the buttons, then the resume, then design and details. Wide screens: controls
        // on the left, the resume on the right.
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
          <div className="space-y-5 lg:col-start-1 lg:row-start-1">
            <div>
              <Eyebrow>YOUR RESUME</Eyebrow>
              <h1 className="mt-3 text-[28px] font-black leading-tight tracking-[-0.05em] text-foreground">
                {source === "pdf" ? "Your resume, in a clean design" : "Your resume is started"}
              </h1>
              <p className="mt-2 text-[14px] text-muted-foreground">
                Sign up free to keep editing every line, check it against ATS software and download it as PDF or Word.
              </p>
            </div>
            <div className="grid gap-2">
              <Button asChild className="h-12 rounded-xl text-[15px] shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] hover:bg-primary/90">
                <Link href={GUEST_DRAFT_SIGN_UP_HREF} onClick={() => goSignUp("save")}>
                  Save and keep editing, free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl">
                <Link href={GUEST_DRAFT_SIGN_UP_HREF} onClick={() => goSignUp("download")}>
                  <Download className="h-4 w-4" /> Download PDF or Word
                </Link>
              </Button>
              <p className="text-center text-[12px] text-muted-foreground">Free account. Your resume comes with you.</p>
            </div>
          </div>

          <div className="min-w-0 rounded-[22px] border border-border bg-muted/40 p-3 sm:p-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start" aria-label={`Your resume in ${templateName}`}>
            <ResumeTemplatePreview templateId={templateId} content={content} sectionOrder={sectionOrder} />
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> Preview. Every line is editable after you sign up.
            </p>
          </div>
          <aside className="space-y-5 lg:col-start-1 lg:row-start-2" aria-label="Design and details">
            <section className="rounded-[22px] border border-border bg-card p-5" aria-labelledby="gb-design">
              <Mono id="gb-design" className="text-[11px] text-primary">— DESIGN —</Mono>
              {templates.length === 0 ? (
                <p className="mt-2 text-[13px] text-muted-foreground">Loading designs…</p>
              ) : (
                <ul className="mt-3 grid grid-cols-4 gap-2" role="listbox" aria-label="Resume designs">
                  {templates.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={t.id === templateId}
                        aria-label={t.name}
                        title={t.name}
                        onClick={() => {
                          setTemplateId(t.id);
                          track("resume_template_selected", { template_id: t.id, surface: "guest_builder" });
                        }}
                        className={cn("block w-full rounded-lg p-0.5 ring-2 ring-transparent transition", t.id === templateId ? "ring-primary" : "hover:ring-border")}
                      >
                        <TemplatePreview template={t} isSelected={t.id === templateId} variant="thumb" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[12.5px] text-muted-foreground">Showing: <span className="font-medium text-foreground">{templateName}</span></p>
            </section>

            <section className="rounded-[22px] border border-border bg-card p-5" aria-labelledby="gb-details">
              <Mono id="gb-details" className="text-[11px] text-primary">— YOUR DETAILS —</Mono>
              <div className="mt-3 space-y-3">
                {BASIC_FIELDS.map((f) => (
                  <label key={f.key} className="block">
                    <span className="text-[12.5px] text-muted-foreground">{f.label}</span>
                    <input
                      type={f.type ?? "text"}
                      autoComplete={f.autoComplete}
                      value={basics[f.key]}
                      onChange={(e) => updateBasic(f.key, e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-[13.5px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-muted-foreground">
                {source === "scratch" ? "Example lines are marked in the editor so you can replace them. " : ""}
                Saved only in this browser until you sign up.
              </p>
            </section>

            <button type="button" onClick={startOver} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Start over
            </button>
          </aside>

        </div>
      )}
    </div>
  );
}
