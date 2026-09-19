"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppSelect } from "@/components/ui/app-select";
import { ProfileCtcField } from "@/components/profile/ProfileCtcField";
import { jobTrackerApi } from "@/lib/api";
import {
  parseCompensationInput,
  type CtcUnit,
} from "@/lib/profile-compensation";
import { appCard, appPrimaryButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  JOB_TRACKER_SOURCES,
  JOB_TRACKER_SOURCE_LABELS,
  JOB_TRACKER_TYPES,
  JOB_TRACKER_TYPE_LABELS,
  JOB_TRACKER_WORK_MODES,
  JOB_TRACKER_WORK_MODE_LABELS,
  type JobTrackerDetail,
} from "@/lib/job-tracker";

type FormState = {
  title: string;
  role: string;
  company: string;
  jobLink: string;
  source: string;
  sourceCustom: string;
  jobType: string;
  locationText: string;
  workMode: string;
  expectedCtcAmount: string;
  expectedCtcUnit: CtcUnit;
  appliedAt: string;
  jobDescription: string;
};

const emptyForm = (): FormState => ({
  title: "",
  role: "",
  company: "",
  jobLink: "",
  source: "other",
  sourceCustom: "",
  jobType: "full_time",
  locationText: "",
  workMode: "onsite",
  expectedCtcAmount: "",
  expectedCtcUnit: "lpa",
  appliedAt: "",
  jobDescription: "",
});

const controlClass = "h-11 w-full min-w-0 text-base sm:text-sm";

function FormField({
  label,
  htmlFor,
  hint,
  stacked = false,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  stacked?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-1.5 sm:gap-2",
        !stacked &&
          "md:grid-cols-[11rem_minmax(0,1fr)] md:items-start md:gap-x-5 lg:grid-cols-[12rem_minmax(0,1fr)]",
        className,
      )}
    >
      <div className={cn(!stacked && "md:pt-2.5")}>
        <Label
          htmlFor={htmlFor}
          className="text-sm font-medium leading-snug text-foreground"
        >
          {label}
        </Label>
        {hint ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function AddApplicationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (detail: JobTrackerDetail) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setForm(emptyForm());
  }, [open]);

  const update = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const submit = async () => {
    if (!form.title.trim() || !form.company.trim()) {
      toast.error("Job title and company are required");
      return;
    }
    setSaving(true);
    try {
      const detail = await jobTrackerApi.create({
        title: form.title.trim(),
        role: form.role.trim() || form.title.trim(),
        company: form.company.trim(),
        jobLink: form.jobLink.trim() || undefined,
        source: form.source,
        sourceCustom: form.sourceCustom.trim() || undefined,
        jobType: form.jobType,
        locationText: form.locationText.trim() || undefined,
        workMode: form.workMode,
        expectedCtc: parseCompensationInput(
          form.expectedCtcAmount,
          form.expectedCtcUnit,
        ),
        appliedAt: form.appliedAt || undefined,
        jobDescription: form.jobDescription.trim() || undefined,
        status: "saved",
      });
      toast.success("Job added");
      onCreated(detail);
      onOpenChange(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to add job";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          appCard,
          "flex max-h-[min(92svh,720px)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl",
        )}
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-4 sm:px-6">
          <DialogTitle>Add Job</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid gap-5">
            <div className="grid gap-4">
              <FormField label="Job title *" htmlFor="jt-title">
                <Input
                  id="jt-title"
                  value={form.title}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="Senior Full Stack Engineer"
                  className={controlClass}
                />
              </FormField>
              <FormField label="Company *" htmlFor="jt-company">
                <Input
                  id="jt-company"
                  value={form.company}
                  onChange={(e) => update({ company: e.target.value })}
                  placeholder="Acme Inc."
                  className={controlClass}
                />
              </FormField>
              <FormField
                label="Role applied for"
                htmlFor="jt-role"
                hint="Defaults to job title if left blank"
              >
                <Input
                  id="jt-role"
                  value={form.role}
                  onChange={(e) => update({ role: e.target.value })}
                  placeholder="Same as job title"
                  className={controlClass}
                />
              </FormField>
              <FormField label="Job link" htmlFor="jt-link">
                <Input
                  id="jt-link"
                  type="url"
                  inputMode="url"
                  value={form.jobLink}
                  onChange={(e) => update({ jobLink: e.target.value })}
                  placeholder="https://..."
                  className={controlClass}
                />
              </FormField>
            </div>

            <div
              className={cn(
                "grid gap-4",
                form.source === "other" && "sm:grid-cols-2",
              )}
            >
              <FormField label="Source" stacked>
                <AppSelect
                  value={form.source}
                  onChange={(source) =>
                    update({
                      source,
                      sourceCustom: source === "other" ? form.sourceCustom : "",
                    })
                  }
                  options={JOB_TRACKER_SOURCES.map((source) => ({
                    value: source,
                    label: JOB_TRACKER_SOURCE_LABELS[source],
                  }))}
                  className={controlClass}
                />
              </FormField>
              {form.source === "other" ? (
                <FormField
                  label="Custom source"
                  htmlFor="jt-source-custom"
                  stacked
                >
                  <Input
                    id="jt-source-custom"
                    value={form.sourceCustom}
                    onChange={(e) => update({ sourceCustom: e.target.value })}
                    placeholder="e.g. Employee referral, WhatsApp group"
                    className={controlClass}
                  />
                </FormField>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Job type" stacked>
                <AppSelect
                  value={form.jobType}
                  onChange={(jobType) => update({ jobType })}
                  options={JOB_TRACKER_TYPES.map((type) => ({
                    value: type,
                    label: JOB_TRACKER_TYPE_LABELS[type],
                  }))}
                  className={controlClass}
                />
              </FormField>
              <FormField label="Work mode" stacked>
                <AppSelect
                  value={form.workMode}
                  onChange={(workMode) => update({ workMode })}
                  options={JOB_TRACKER_WORK_MODES.map((mode) => ({
                    value: mode,
                    label: JOB_TRACKER_WORK_MODE_LABELS[mode],
                  }))}
                  className={controlClass}
                />
              </FormField>
              <FormField
                label="Applied date"
                htmlFor="jt-applied"
                stacked
                className="sm:col-span-2 lg:col-span-1"
              >
                <Input
                  id="jt-applied"
                  type="date"
                  value={form.appliedAt}
                  onChange={(e) => update({ appliedAt: e.target.value })}
                  className={controlClass}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Location" htmlFor="jt-location" stacked>
                <Input
                  id="jt-location"
                  value={form.locationText}
                  onChange={(e) => update({ locationText: e.target.value })}
                  placeholder="Bengaluru, Karnataka"
                  className={controlClass}
                />
              </FormField>
              <ProfileCtcField
                id="jt-expected-ctc"
                label="Expected CTC"
                amount={form.expectedCtcAmount}
                unit={form.expectedCtcUnit}
                placeholder="e.g. 18"
                fieldClassName="grid gap-1.5 sm:gap-2"
                labelClassName="text-sm font-medium leading-snug text-foreground"
                inputClassName={controlClass}
                onAmountChange={(expectedCtcAmount) =>
                  update({ expectedCtcAmount })
                }
                onUnitChange={(expectedCtcUnit) =>
                  update({ expectedCtcUnit })
                }
              />
            </div>

            <FormField
              label="Job description"
              htmlFor="jt-jd"
              hint="Used for resume scoring and practice interviews"
            >
              <Textarea
                id="jt-jd"
                value={form.jobDescription}
                onChange={(e) => update({ jobDescription: e.target.value })}
                placeholder="Paste the full job description"
                rows={6}
                className="min-h-[140px] w-full min-w-0 resize-y text-base sm:text-sm"
              />
            </FormField>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-col-reverse gap-2 border-t border-border/60 px-4 py-4 sm:flex-row sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className={cn(appPrimaryButton, "h-11 w-full sm:w-auto")}
            onClick={submit}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Add Job"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
