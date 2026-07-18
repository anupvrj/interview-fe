"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Briefcase,
  Check,
  IndianRupee,
  Layers,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { JobRoleSelect } from "@/components/career/JobRoleSelect";
import { cn } from "@/lib/utils";
import {
  getRolesForIndustry,
  industrySelectOptions,
} from "@/lib/career-catalog";
import { peerApi, type PeerInterviewType } from "@/lib/api";

const controlClass = "app-control w-full bg-card";

export function InterviewerOnboardingForm({
  types,
  initialName,
  onSubmitted,
  showHeader = true,
  className,
}: {
  types: PeerInterviewType[];
  initialName?: string;
  onSubmitted: () => void;
  showHeader?: boolean;
  className?: string;
}) {
  const { user } = useUser();
  const [name, setName] = useState(initialName || user?.fullName || "");
  const [jobRole, setJobRole] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [yearsOfExperience, setYears] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [pricing, setPricing] = useState<Record<string, string>>({});
  const [frontKey, setFrontKey] = useState<string | null>(null);
  const [backKey, setBackKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"front" | "back" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const roleOptions = useMemo(
    () => getRolesForIndustry(industry),
    [industry],
  );

  useEffect(() => {
    if (jobRole && !roleOptions.includes(jobRole)) {
      setJobRole("");
    }
  }, [jobRole, roleOptions]);

  const [pricingTouched, setPricingTouched] = useState<Record<string, boolean>>({});

  const validatePrice = (
    raw: string,
    cap: number,
    requireTouchedForEmpty: boolean,
    touched: boolean,
  ): string | null => {
    if (!raw.trim()) {
      return requireTouchedForEmpty && !touched ? null : "Enter your price per session";
    }
    const num = Number(raw);
    if (!Number.isFinite(num) || num <= 0) return "Enter a valid amount greater than 0";
    if (num > cap) return `Maximum allowed is ₹${cap}`;
    return null;
  };

  const isRoundPriceValid = (key: string, cap: number) =>
    validatePrice(pricing[key] ?? "", cap, false, true) === null;

  const getFirstValidationError = (): string | null => {
    if (!name.trim()) return "Enter your full name";
    if (!industry) return "Select your industry";
    if (!jobRole) return "Select your current role / title";
    if (!company.trim()) return "Enter your company name";
    if (!workEmail.trim()) return "Enter your work email for verification";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail.trim())) {
      return "Enter a valid work email address";
    }
    if (!frontKey || !backKey) return "Upload both sides of your corporate ID";
    if (selectedTypes.length === 0) {
      return "Select at least one interview round you can conduct";
    }
    for (const key of selectedTypes) {
      const type = types.find((t) => t.key === key);
      const cap = type?.maxPriceCap ?? 0;
      const err = validatePrice(pricing[key] ?? "", cap, false, true);
      if (err) {
        return type ? `${type.name}: ${err}` : err;
      }
    }
    return null;
  };

  const canSubmit = useMemo(() => getFirstValidationError() === null, [
    name,
    industry,
    jobRole,
    company,
    workEmail,
    frontKey,
    backKey,
    selectedTypes,
    pricing,
    types,
  ]);

  const markPricingTouchedForSelected = () => {
    setPricingTouched((prev) => {
      const next = { ...prev };
      for (const key of selectedTypes) next[key] = true;
      return next;
    });
  };

  const toggleType = (key: string) => {
    setSelectedTypes((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      if (!next.includes(key)) {
        setPricingTouched((t) => {
          const copy = { ...t };
          delete copy[key];
          return copy;
        });
      }
      return next;
    });
  };

  const setPrice = (key: string, value: string) => {
    setPricingTouched((t) => ({ ...t, [key]: true }));
    setPricing((p) => ({ ...p, [key]: value }));
  };

  const pricingHasErrors = selectedTypes.some((key) => {
    const cap = types.find((t) => t.key === key)?.maxPriceCap ?? 0;
    return !isRoundPriceValid(key, cap) && Boolean(pricingTouched[key] || pricing[key]?.trim());
  });

  const handleSubmitClick = () => {
    const validationError = getFirstValidationError();
    if (validationError) {
      markPricingTouchedForSelected();
      toast.error(validationError);
      return;
    }
    void submitApplication();
  };

  const upload = async (side: "front" | "back", file?: File) => {
    if (!file) return;
    setUploading(side);
    try {
      const { key } = await peerApi.uploadIdDocument(file);
      if (side === "front") setFrontKey(key);
      else setBackKey(key);
      toast.success(`Uploaded ${side} of corporate ID`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const submitApplication = async () => {
    const validationError = getFirstValidationError();
    if (validationError) {
      markPricingTouchedForSelected();
      toast.error(validationError);
      return;
    }

    const pricingNum: Record<string, number> = {};
    for (const key of selectedTypes) {
      pricingNum[key] = Number(pricing[key]);
    }

    setSubmitting(true);
    try {
      await peerApi.apply({
        name,
        jobRole,
        company,
        industry,
        yearsOfExperience: Number(yearsOfExperience) || 0,
        workEmail,
        canTakeTypes: selectedTypes,
        pricing: pricingNum,
        corporateIdFrontKey: frontKey,
        corporateIdBackKey: backKey,
        profilePictureUrl: user?.imageUrl,
      });
      toast.success("Application submitted! Our team will review it shortly.");
      onSubmitted();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn("mx-auto w-full max-w-2xl", className)}>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        {showHeader ? (
          <div className="border-b border-border/60 bg-gradient-to-br from-[#7367F0]/10 to-transparent px-5 py-5 text-center sm:px-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Become an interviewer
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
              Share your details for verification. Our team reviews applications within 24–48
              hours.
            </p>
          </div>
        ) : null}

        <div className="space-y-8 px-4 py-6 sm:px-6 sm:py-8">
          <FormSection
            icon={Briefcase}
            title="Professional profile"
            description="Tell candidates who you are and where you work."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Full name" htmlFor="apply-name" className="sm:col-span-2">
                <Input
                  id="apply-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-card"
                  placeholder="Your full name"
                />
              </FormField>

              <FormField label="Industry" htmlFor="apply-industry">
                <AppSelect
                  id="apply-industry"
                  value={industry}
                  onChange={(v) => {
                    setIndustry(v);
                    setJobRole("");
                  }}
                  allowEmpty
                  emptyLabel="Select industry"
                  options={industrySelectOptions()}
                />
              </FormField>

              <FormField label="Current role / title" htmlFor="apply-role">
                <JobRoleSelect
                  id="apply-role"
                  value={jobRole}
                  onChange={setJobRole}
                  industry={industry || undefined}
                  disabled={!industry}
                  placeholder={
                    industry ? "Type or select your role" : "Select industry first"
                  }
                  inputClassName="h-11 bg-card"
                />
              </FormField>

              <FormField label="Company" htmlFor="apply-company">
                <Input
                  id="apply-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="bg-card"
                  placeholder="e.g. Google, Amazon"
                />
              </FormField>

              <FormField label="Years of experience" htmlFor="apply-exp">
                <Input
                  id="apply-exp"
                  type="number"
                  min={0}
                  value={yearsOfExperience}
                  onChange={(e) => setYears(e.target.value)}
                  className="bg-card"
                  placeholder="e.g. 5"
                />
              </FormField>

              <FormField
                label="Work email (for verification)"
                htmlFor="apply-email"
                className="sm:col-span-2"
                hint="Must match your company domain for manual verification."
              >
                <Input
                  id="apply-email"
                  type="email"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  className="bg-card"
                  placeholder="you@company.com"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection
            icon={ShieldCheck}
            title="Identity verification"
            description="Upload both sides of your corporate ID (image or PDF)."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <IdUpload
                label="Corporate ID — Front"
                uploaded={!!frontKey}
                uploading={uploading === "front"}
                onSelect={(f) => upload("front", f)}
              />
              <IdUpload
                label="Corporate ID — Back"
                uploaded={!!backKey}
                uploading={uploading === "back"}
                onSelect={(f) => upload("back", f)}
              />
            </div>
          </FormSection>

          <FormSection
            icon={Layers}
            title="Interview rounds & pricing"
            description="Select rounds you can conduct and set your price per session."
          >
            <fieldset className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
              <legend className="sr-only">Interview rounds and pricing</legend>
              {types.map((t, index) => {
                const active = selectedTypes.includes(t.key);
                const priceError = active
                  ? validatePrice(
                      pricing[t.key] ?? "",
                      t.maxPriceCap,
                      true,
                      Boolean(pricingTouched[t.key]),
                    )
                  : null;
                const priceValid = active && isRoundPriceValid(t.key, t.maxPriceCap);
                return (
                  <div
                    key={t.key}
                    className={cn(
                      "px-4 py-3.5 transition-colors",
                      index > 0 && "border-t border-border/60",
                      active && "bg-[#7367F0]/[0.04]",
                      priceError && active && "bg-destructive/[0.03]",
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleType(t.key)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[#7367F0]"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground">{t.name}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                            {t.shortDescription} · Max ₹{t.maxPriceCap}
                          </span>
                        </span>
                      </label>
                      {active ? (
                        <div className="w-full shrink-0 pl-7 sm:w-auto sm:pl-0 sm:pt-0.5">
                          <div className="flex items-center gap-2">
                            <IndianRupee
                              className={cn(
                                "h-4 w-4 shrink-0",
                                priceError
                                  ? "text-destructive"
                                  : priceValid
                                    ? "text-emerald-600"
                                    : "text-muted-foreground",
                              )}
                            />
                            <Input
                              type="number"
                              min={1}
                              max={t.maxPriceCap}
                              value={pricing[t.key] ?? ""}
                              onChange={(e) => setPrice(t.key, e.target.value)}
                              onBlur={() =>
                                setPricingTouched((prev) => ({ ...prev, [t.key]: true }))
                              }
                              placeholder={`Max ${t.maxPriceCap}`}
                              className={cn(
                                "w-full bg-card sm:w-28",
                                priceError &&
                                  "border-destructive/70 focus-visible:ring-destructive/30",
                                priceValid &&
                                  "border-emerald-400/70 focus-visible:ring-emerald-400/30",
                              )}
                              aria-label={`Price for ${t.name}`}
                              aria-invalid={Boolean(priceError)}
                              aria-describedby={
                                priceError ? `price-error-${t.key}` : undefined
                              }
                            />
                          </div>
                          {priceError ? (
                            <p
                              id={`price-error-${t.key}`}
                              className="mt-1.5 text-right text-[11px] font-medium text-destructive sm:text-left"
                            >
                              {priceError}
                            </p>
                          ) : priceValid ? (
                            <p className="mt-1.5 text-right text-[11px] text-emerald-600 sm:text-left">
                              Within limit (max ₹{t.maxPriceCap})
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </fieldset>
            {selectedTypes.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-[#7367F0]">
                  {selectedTypes.length} round{selectedTypes.length === 1 ? "" : "s"} selected
                </p>
                {pricingHasErrors ? (
                  <p className="text-xs font-medium text-destructive">
                    Fix pricing errors before submitting
                  </p>
                ) : null}
              </div>
            ) : null}
          </FormSection>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {!canSubmit && !submitting ? (
            <p className="text-xs text-muted-foreground">
              Complete all required fields with valid values to submit
            </p>
          ) : (
            <span className="hidden sm:block" />
          )}
          <div className="relative w-full sm:w-auto">
            {!canSubmit && !submitting && uploading === null ? (
              <button
                type="button"
                aria-label="Show what is required to submit"
                className="absolute inset-0 z-10 cursor-not-allowed rounded-md"
                onClick={handleSubmitClick}
              />
            ) : null}
            <Button
              type="button"
              onClick={() => void submitApplication()}
              disabled={submitting || uploading !== null || !canSubmit}
              className="relative w-full bg-[#7367F0] text-white hover:bg-[#6e62e5] disabled:opacity-50 sm:w-auto"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit application
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Briefcase;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function FormField({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function IdUpload({
  label,
  uploaded,
  uploading,
  onSelect,
}: {
  label: string;
  uploaded: boolean;
  uploading: boolean;
  onSelect: (file?: File) => void;
}) {
  return (
    <label
      className={cn(
        "flex min-h-[5.5rem] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-center transition-colors sm:min-h-[6.5rem]",
        uploaded
          ? "border-emerald-400/80 bg-emerald-50/50 dark:bg-emerald-950/20"
          : "border-border/70 bg-card hover:border-[#7367F0]/40 hover:bg-[#7367F0]/[0.03]",
      )}
    >
      <input
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0])}
      />
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          uploaded ? "bg-emerald-100 text-emerald-600" : "bg-muted text-[#7367F0]",
        )}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : uploaded ? (
          <Check className="h-5 w-5" />
        ) : (
          <Upload className="h-5 w-5" />
        )}
      </span>
      <span className="text-sm">
        <span className="block font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {uploaded ? "Uploaded successfully" : "Tap to upload image or PDF"}
        </span>
      </span>
    </label>
  );
}
