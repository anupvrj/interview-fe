"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useDropzone } from "react-dropzone";
import { CheckCircle2, FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InstituteFormStepper } from "@/components/institute/InstituteFormStepper";
import { userApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import {
  RESUME_IMPORT_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";
import { cn } from "@/lib/utils";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";
import { appCard } from "@/lib/app-theme";
import { useDashboardInvalidation } from "@/hooks/useDashboardInvalidation";

type Step = "missing" | "upload" | "parsing" | "sync" | "done";

type OpenArgs = {
  onReady?: () => void | Promise<void>;
  message?: string;
};

type Ctx = {
  openResumeRequired: (args?: OpenArgs) => void;
};

const ResumeRequiredContext = createContext<Ctx | null>(null);

export function useResumeRequiredDialog() {
  const ctx = useContext(ResumeRequiredContext);
  if (!ctx) {
    return {
      openResumeRequired: (args?: OpenArgs) => {
        toast.error(
          args?.message ||
            "No saved resume found. Upload a PDF or set a designed resume as default on your profile.",
        );
      },
    };
  }
  return ctx;
}

const STEPS = [
  {
    number: 1,
    title: "Resume",
    headline: "Upload a resume",
    description: "Attach a PDF so we can start your interview.",
    icon: FileText,
  },
  {
    number: 2,
    title: "Parse",
    headline: "Reading your resume",
    description: "We upload the file, then extract role, college, and skills.",
    icon: Loader2,
  },
  {
    number: 3,
    title: "Sync",
    headline: "Sync profile details?",
    description: "Choose whether to add the extracted details to your profile.",
    icon: CheckCircle2,
  },
];

export function isMissingResumeError(message?: string | null): boolean {
  return /no saved resume found|resume is required/i.test(message || "");
}

export function ResumeRequiredDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("missing");
  const [file, setFile] = useState<File | null>(null);
  const [parseStatus, setParseStatus] = useState<"uploading" | "parsing">("uploading");
  const [error, setError] = useState("");
  const [extracted, setExtracted] = useState<{
    currentJob?: { company?: string; role?: string; industry?: string };
    skills?: string[];
    education?: string[];
    experience?: number;
  } | null>(null);
  const [onReady, setOnReady] = useState<(() => void | Promise<void>) | undefined>();
  const [continuing, setContinuing] = useState(false);
  const { invalidate } = useDashboardInvalidation();

  const reset = () => {
    setStep("missing");
    setFile(null);
    setParseStatus("uploading");
    setError("");
    setExtracted(null);
    setContinuing(false);
  };

  const openResumeRequired = useCallback((args?: OpenArgs) => {
    reset();
    setOnReady(() => args?.onReady);
    setOpen(true);
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    const next = accepted[0];
    if (next) {
      setFile(next);
      setError("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: RESUME_IMPORT_MAX_BYTES,
    accept: pdfResumeDropzoneAccept,
    validator: pdfResumeFileValidator,
  });

  const runUpload = async () => {
    if (!file) {
      setError("Choose a PDF first.");
      return;
    }
    setError("");
    setStep("parsing");
    setParseStatus("uploading");
    try {
      await new Promise((r) => setTimeout(r, 400));
      setParseStatus("parsing");
      const result = await userApi.extractResumeData(file);
      setExtracted(result.extracted || {});
      await invalidate(["resumes", "profile"]);
      setStep("sync");
    } catch (err) {
      setError(getApiErrorMessage(err, "Resume upload failed. Please try again."));
      setStep("upload");
    }
  };

  const finish = async (syncProfile: boolean) => {
    if (syncProfile && extracted) {
      try {
        await userApi.updateProfile({
          ...(extracted.currentJob?.role ? { targetJobRole: extracted.currentJob.role } : {}),
          ...(extracted.currentJob
            ? {
                currentJob: {
                  company: extracted.currentJob.company || "",
                  role: extracted.currentJob.role || "",
                  industry: extracted.currentJob.industry,
                },
              }
            : {}),
          ...(extracted.currentJob?.industry ? { industry: extracted.currentJob.industry } : {}),
          ...(extracted.skills?.length ? { skills: extracted.skills.slice(0, 30) } : {}),
          ...(typeof extracted.experience === "number" ? { experience: extracted.experience } : {}),
        });
      } catch {
        toast.error("Resume is uploaded. Profile details could not be synced.");
      }
    }
    setStep("done");
  };

  const continueInterview = async () => {
    setContinuing(true);
    try {
      await onReady?.();
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not continue the interview."));
    } finally {
      setContinuing(false);
    }
  };

  const value = useMemo(() => ({ openResumeRequired }), [openResumeRequired]);
  const stepperStep = step === "missing" || step === "upload" ? 1 : step === "parsing" ? 2 : 3;

  return (
    <ResumeRequiredContext.Provider value={value}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent
          className={cn(
            appCard,
            "flex max-h-[min(92svh,40rem)] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg",
          )}
        >
          <DialogHeader className="border-b border-border/60 px-4 py-4 sm:px-6">
            <DialogTitle>Resume required</DialogTitle>
            <DialogDescription>
              Upload a PDF and set it as your default resume to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <InstituteFormStepper steps={STEPS} currentStep={stepperStep} className="mb-4" />
            {error ? (
              <p className="mb-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            {step === "missing" ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                No saved resume found. Upload a PDF now. This stays on this page — we will not send
                you to the dashboard.
              </p>
            ) : null}

            {step === "upload" ? (
              <div
                {...getRootProps()}
                className={cn(
                  "mt-4 cursor-pointer rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center",
                  isDragActive && "border-primary bg-primary/5",
                )}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-8 w-8 text-[#7367F0]" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  {file ? file.name : "Drop a PDF here or click to browse"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">PDF up to 5 MB</p>
              </div>
            ) : null}

            {step === "parsing" ? (
              <div className="space-y-2 py-6 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#7367F0]" />
                <p className="text-sm font-medium text-foreground">
                  {parseStatus === "uploading"
                    ? "Your resume is being uploaded…"
                    : "Done. Your details are being parsed."}
                </p>
              </div>
            ) : null}

            {step === "sync" ? (
              <div className="space-y-3 text-sm">
                <p className="leading-relaxed text-muted-foreground">
                  We collected profile details like current role, colleges, and skills. Would you
                  like to sync these with your profile?
                </p>
                {extracted?.currentJob?.role || extracted?.skills?.length ? (
                  <ul className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-foreground">
                    {extracted.currentJob?.role ? (
                      <li>Role: {extracted.currentJob.role}</li>
                    ) : null}
                    {extracted.education?.length ? (
                      <li>Education: {extracted.education.slice(0, 2).join(", ")}</li>
                    ) : null}
                    {extracted.skills?.length ? (
                      <li>Skills: {extracted.skills.slice(0, 8).join(", ")}</li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {step === "done" ? (
              <p className="py-4 text-sm leading-relaxed text-muted-foreground">
                Your resume is uploaded. Continue with the interview.
              </p>
            ) : null}
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 border-t border-border/60 px-4 py-3 sm:flex-row sm:px-6">
            {step === "missing" ? (
              <Button className={cn("h-11 w-full sm:w-auto", institutePrimaryClass)} onClick={() => setStep("upload")}>
                Upload Now
              </Button>
            ) : null}
            {step === "upload" ? (
              <Button
                className={cn("h-11 w-full sm:w-auto", institutePrimaryClass)}
                onClick={() => void runUpload()}
                disabled={!file}
              >
                Upload resume
              </Button>
            ) : null}
            {step === "sync" ? (
              <>
                <Button variant="outline" className="h-11 w-full sm:w-auto" onClick={() => void finish(false)}>
                  No, just keep the resume
                </Button>
                <Button className={cn("h-11 w-full sm:w-auto", institutePrimaryClass)} onClick={() => void finish(true)}>
                  Yes, sync my profile
                </Button>
              </>
            ) : null}
            {step === "done" ? (
              <Button
                className={cn("h-11 w-full sm:w-auto", institutePrimaryClass)}
                onClick={() => void continueInterview()}
                disabled={continuing}
              >
                {continuing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continue with interview
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ResumeRequiredContext.Provider>
  );
}
