"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Upload,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recruiterApi, type RecruiterType } from "@/lib/api";
import { appPrimaryButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

type DocKey =
  | "registrationCertKey"
  | "panCardKey"
  | "tradeCertKey"
  | "workIdKey";

/** Label above control — matches InterviewerOnboardingForm layout. */
function FormField({
  label,
  htmlFor,
  hint,
  required,
  className,
  children,
}: Readonly<{
  label: ReactNode;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}>) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label
        htmlFor={htmlFor}
        className="block text-xs font-medium text-muted-foreground"
      >
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </Label>
      {children}
      {hint ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Compact upload control — label is rendered separately via FormField. */
function DocUpload({
  uploaded,
  uploading,
  onSelect,
}: Readonly<{
  uploaded: boolean;
  uploading: boolean;
  onSelect: (file: File) => void;
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary",
        uploaded &&
          "border-emerald-400/70 bg-emerald-50/50 dark:bg-emerald-950/20",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          uploaded
            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40"
            : "bg-[#7367F0]/10 text-[#7367F0]",
        )}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : uploaded ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
      </span>
      <span className="min-w-0 flex-1 text-sm text-muted-foreground">
        {uploaded
          ? "Uploaded — tap to replace"
          : "Click to upload (image or PDF)"}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />
    </button>
  );
}

export function RecruiterOnboardingForm({
  onSubmitted,
  className,
}: Readonly<{ onSubmitted?: () => void; className?: string }>) {
  const [recruiterType, setRecruiterType] =
    useState<RecruiterType>("individual");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [recruiterRole, setRecruiterRole] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [docs, setDocs] = useState<Partial<Record<DocKey, string>>>({});
  const [uploading, setUploading] = useState<DocKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const upload = async (key: DocKey, file: File) => {
    setUploading(key);
    try {
      const { key: s3Key } = await recruiterApi.uploadDocument(file);
      setDocs((prev) => ({ ...prev, [key]: s3Key }));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const submit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Enter your first and last name");
      return;
    }
    if (!recruiterRole.trim()) {
      toast.error("Enter your role");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail.trim())) {
      toast.error("Enter a valid work email");
      return;
    }
    if (!docs.workIdKey) {
      toast.error("Upload your recruiter work ID");
      return;
    }
    if (recruiterType === "company") {
      if (!companyName.trim()) {
        toast.error("Enter your company name");
        return;
      }
      if (!docs.registrationCertKey) {
        toast.error("Upload your company registration certificate");
        return;
      }
    }

    setSubmitting(true);
    try {
      await recruiterApi.apply({
        recruiterType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        recruiterRole: recruiterRole.trim(),
        workEmail: workEmail.trim(),
        companyName:
          recruiterType === "company" ? companyName.trim() : undefined,
        companyDocs:
          recruiterType === "company"
            ? {
                registrationCertKey: docs.registrationCertKey,
                panCardKey: docs.panCardKey,
                tradeCertKey: docs.tradeCertKey,
              }
            : undefined,
        workIdKey: docs.workIdKey!,
      });
      toast.success("Application submitted for review");
      onSubmitted?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn("mx-auto w-full max-w-2xl", className)}>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <div className="border-b border-border/60 bg-gradient-to-br from-[#7367F0]/10 to-transparent px-5 py-5 text-center sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Become a Recruiter
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            Apply to hire iX Talent. Our team reviews applications within 24-48
            hours.
          </p>
        </div>

        <div className="space-y-6 px-4 py-6 sm:px-6 sm:py-8">
          {/* Recruiter type */}
          <FormField label="I am registering as">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  value: "individual" as const,
                  icon: UserIcon,
                  title: "Individual",
                  desc: "Independent recruiter or hiring manager",
                },
                {
                  value: "company" as const,
                  icon: Building2,
                  title: "Company",
                  desc: "Hiring on behalf of a registered company",
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = recruiterType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecruiterType(opt.value)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                      active
                        ? "border-[#7367F0] bg-[#7367F0]/5"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        active
                          ? "bg-[#7367F0] text-white"
                          : "bg-[#7367F0]/10 text-[#7367F0]",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        {opt.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {opt.desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </FormField>

          {/* Contact person */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="First name" htmlFor="rec-first">
              <Input
                id="rec-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full bg-card"
              />
            </FormField>
            <FormField label="Last name" htmlFor="rec-last">
              <Input
                id="rec-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full bg-card"
              />
            </FormField>
            <FormField label="Your role" htmlFor="rec-role">
              <Input
                id="rec-role"
                value={recruiterRole}
                onChange={(e) => setRecruiterRole(e.target.value)}
                placeholder="e.g. Talent Acquisition Lead"
                className="w-full bg-card"
              />
            </FormField>
            <FormField label="Work email" htmlFor="rec-email">
              <Input
                id="rec-email"
                type="email"
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-card"
              />
            </FormField>
          </div>

          {/* Recruiter Work ID */}
          <FormField
            label="Recruiter Work ID"
            required
            hint="Upload your work ID card or employee badge for verification."
          >
            <DocUpload
              uploaded={!!docs.workIdKey}
              uploading={uploading === "workIdKey"}
              onSelect={(f) => upload("workIdKey", f)}
            />
          </FormField>

          {/* Company details */}
          {recruiterType === "company" ? (
            <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
              <FormField label="Company name" htmlFor="rec-company">
                <Input
                  id="rec-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Registered company name"
                  className="w-full bg-card"
                />
              </FormField>
              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">
                  Company documents
                </p>
                <FormField
                  label="Registration / Incorporation certificate"
                  required
                >
                  <DocUpload
                    uploaded={!!docs.registrationCertKey}
                    uploading={uploading === "registrationCertKey"}
                    onSelect={(f) => upload("registrationCertKey", f)}
                  />
                </FormField>
                <FormField label="Company PAN card">
                  <DocUpload
                    uploaded={!!docs.panCardKey}
                    uploading={uploading === "panCardKey"}
                    onSelect={(f) => upload("panCardKey", f)}
                  />
                </FormField>
                <FormField label="Trade certificate / GST">
                  <DocUpload
                    uploaded={!!docs.tradeCertKey}
                    uploading={uploading === "tradeCertKey"}
                    onSelect={(f) => upload("tradeCertKey", f)}
                  />
                </FormField>
              </div>
            </div>
          ) : null}

          <Button
            type="button"
            onClick={() => void submit()}
            disabled={submitting || uploading !== null}
            className={cn(appPrimaryButton, "h-11 w-full")}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit application"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
