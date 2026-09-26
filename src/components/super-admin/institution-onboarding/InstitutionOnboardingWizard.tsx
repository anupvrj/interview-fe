"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  ClipboardCheck,
  Loader2,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/FormField";
import {
  InstituteFormStepper,
  type InstituteFormStep,
} from "@/components/institute/InstituteFormStepper";
import {
  InstitutionIntegrityFields,
  integrityFromInstitution,
} from "@/components/super-admin/InstitutionIntegrityFields";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  defaultInstitutionProducts,
  INSTITUTION_PRODUCT_KEYS,
  INSTITUTION_PRODUCT_LABELS,
} from "@/lib/institution-flags";
import type { IntegritySettings } from "@/lib/integrity/settings";
import { DEFAULT_INTEGRITY_SETTINGS } from "@/lib/integrity/settings";
import {
  BILLING_TERM_HINTS,
  BILLING_TERM_LABELS,
  checkSeatAllocation,
  DEFAULT_GRACE_DAYS,
  formatLifecycleDate,
  INSTITUTION_BILLING_TERMS,
  MAX_GRACE_DAYS,
  seatPlanLabel,
  toDateInputValue,
  type InstitutionBillingTerm,
  type SeatEligiblePlanId,
  type SeatRowDraft,
} from "@/lib/institution-lifecycle";
import { PlanSeatAllocator, newSeatRow } from "./PlanSeatAllocator";

const STEPS: InstituteFormStep[] = [
  {
    number: 1,
    title: "Basic info",
    headline: "Institute details",
    description: "Name, URL slug, and who to contact at the institute.",
    icon: Building2,
  },
  {
    number: 2,
    title: "Plan & seats",
    headline: "Seat quota",
    description: "Set total seats and split them across plans.",
    icon: Users,
  },
  {
    number: 3,
    title: "Billing",
    headline: "Billing term and go-live",
    description: "Billing starts on the day you mark the institute live.",
    icon: CalendarClock,
  },
  {
    number: 4,
    title: "Features",
    headline: "Products and integrity",
    description: "Choose what institute candidates can access.",
    icon: SlidersHorizontal,
  },
  {
    number: 5,
    title: "Review",
    headline: "Review and confirm",
    description: "Check everything before saving.",
    icon: ClipboardCheck,
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Institution to edit; omit to create. */
  institution?: any | null;
  onSaved: () => void | Promise<void>;
}>;

export function InstitutionOnboardingWizard({ open, onOpenChange, institution, onSaved }: Props) {
  const isEdit = Boolean(institution?._id);
  const [step, setStep] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [totalSeats, setTotalSeats] = useState("");
  const [seatRows, setSeatRows] = useState<SeatRowDraft[]>([]);
  const [usedByPlan, setUsedByPlan] = useState<Record<string, number>>({});

  const [term, setTerm] = useState<InstitutionBillingTerm>("yearly");
  const [plannedGoLive, setPlannedGoLive] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [graceDays, setGraceDays] = useState(String(DEFAULT_GRACE_DAYS));

  const [biometric, setBiometric] = useState(false);
  const [integrity, setIntegrity] = useState<IntegritySettings>(DEFAULT_INTEGRITY_SETTINGS);
  const [products, setProducts] = useState(defaultInstitutionProducts);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setShowErrors(false);
    const inst = institution;
    setName(inst?.name ?? "");
    setSlug(inst?.slug ?? "");
    setDomain(inst?.domain ?? "");
    setContactEmail(inst?.contactEmail ?? "");
    const rows = ((inst?.planSeats ?? []) as Array<{ planId: string; purchased: number }>)
      .filter((r) => r.planId !== "free" && r.purchased > 0)
      .map((r) => newSeatRow(r.planId as SeatEligiblePlanId, String(r.purchased)));
    setSeatRows(inst ? rows : [newSeatRow("tech_basic", "")]);
    const total =
      inst?.totalSeats ??
      inst?.maxUsers ??
      (rows.length ? rows.reduce((a, r) => a + Number(r.count), 0) : null);
    setTotalSeats(total != null ? String(total) : "");
    setUsedByPlan({});
    setTerm((inst?.billing?.term as InstitutionBillingTerm) ?? "yearly");
    setPlannedGoLive(toDateInputValue(inst?.billing?.plannedGoLiveDate));
    setBillingEmail(inst?.billing?.billingEmail ?? "");
    setGraceDays(String(inst?.billing?.graceDays ?? DEFAULT_GRACE_DAYS));
    setBiometric(Boolean(inst?.platformFlags?.biometricVerification));
    setIntegrity(
      inst ? integrityFromInstitution(inst.platformFlags?.integrity) : DEFAULT_INTEGRITY_SETTINGS,
    );
    setProducts({ ...defaultInstitutionProducts(), ...(inst?.platformFlags?.products ?? {}) });

    if (inst?._id) {
      adminApi
        .getInstitutionSeats(String(inst._id))
        .then((usage) => {
          const used: Record<string, number> = {};
          for (const row of usage) {
            if (row.planId !== "free" && row.used > 0) used[row.planId] = row.used;
          }
          setUsedByPlan(used);
        })
        .catch(() => undefined);
    }
  }, [open, institution]);

  const seatCheck = useMemo(
    () => checkSeatAllocation(totalSeats, seatRows, usedByPlan),
    [totalSeats, seatRows, usedByPlan],
  );

  const basicErrors = {
    name: !name.trim() ? "Name is required." : undefined,
    contactEmail:
      contactEmail.trim() && !EMAIL_RE.test(contactEmail.trim())
        ? "Enter a valid email."
        : undefined,
  };
  const graceNum = Number.parseInt(graceDays, 10);
  const billingErrors = {
    plannedGoLive: !isEdit && !plannedGoLive ? "Pick the planned go-live date." : undefined,
    billingEmail:
      billingEmail.trim() && !EMAIL_RE.test(billingEmail.trim())
        ? "Enter a valid email."
        : undefined,
    graceDays:
      !Number.isInteger(graceNum) || graceNum < 0 || graceNum > MAX_GRACE_DAYS
        ? `Between 0 and ${MAX_GRACE_DAYS} days.`
        : undefined,
  };

  const stepValid = (n: number): boolean => {
    if (n === 1) return !basicErrors.name && !basicErrors.contactEmail;
    if (n === 2) return seatCheck.valid;
    if (n === 3) return !Object.values(billingErrors).some(Boolean);
    return true;
  };

  const goNext = () => {
    if (!stepValid(step)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const goBack = () => {
    setShowErrors(false);
    setStep((s) => Math.max(1, s - 1));
  };

  const seatPayload = seatRows
    .filter((r) => r.planId)
    .map((r) => ({ planId: r.planId as string, purchased: Number.parseInt(r.count, 10) || 0 }));

  const handleSubmit = async () => {
    for (const n of [1, 2, 3]) {
      if (!stepValid(n)) {
        setStep(n);
        setShowErrors(true);
        return;
      }
    }
    const billing = {
      term,
      plannedGoLiveDate: plannedGoLive || null,
      billingEmail: billingEmail.trim() || null,
      graceDays: graceNum,
    };
    const platformFlags = { biometricVerification: biometric, products, integrity };
    try {
      setSubmitting(true);
      if (isEdit) {
        const id = String(institution._id);
        await adminApi.updateInstitution(id, {
          name: name.trim(),
          slug: slug.trim(),
          domain: domain.trim() || null,
          contactEmail: contactEmail.trim() || null,
          billing,
          platformFlags,
        });
        await adminApi.updateInstitutionSeats(id, seatPayload, seatCheck.total);
        toast.success("Institution updated");
      } else {
        await adminApi.createInstitution({
          name: name.trim(),
          slug: slug.trim() || undefined,
          domain: domain.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          totalSeats: seatCheck.total,
          planSeats: seatPayload,
          billing,
          platformFlags,
        });
        toast.success("Institution created in demo mode");
      }
      onOpenChange(false);
      await onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save institution");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="flex max-h-[min(92svh,880px)] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-3xl lg:max-w-4xl">
        <DialogHeader className="space-y-1.5 border-b border-border/60 px-4 py-4 pr-12 text-left sm:px-6">
          <DialogTitle>{isEdit ? "Edit institution" : "Onboard institution"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update details, seat quota, billing, and features."
              : "New institutes start in demo mode. Mark them live once billing is agreed."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <InstituteFormStepper steps={STEPS} currentStep={step} />

          {step === 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Institute name"
                htmlFor="onb-name"
                required
                className="sm:col-span-2"
                error={showErrors ? basicErrors.name : undefined}
              >
                <Input
                  id="onb-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme University"
                  className="h-11"
                />
              </FormField>
              <FormField
                label="Slug"
                htmlFor="onb-slug"
                hint={isEdit ? undefined : "Leave empty to generate from the name."}
              >
                <Input
                  id="onb-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="acme-university"
                  className="h-11"
                />
              </FormField>
              <FormField label="Domain" htmlFor="onb-domain" hint="Used for org-based signup.">
                <Input
                  id="onb-domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="acme.edu"
                  className="h-11"
                />
              </FormField>
              <FormField
                label="Contact email"
                htmlFor="onb-email"
                className="sm:col-span-2"
                error={showErrors ? basicErrors.contactEmail : undefined}
              >
                <Input
                  id="onb-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="admin@acme.edu"
                  className="h-11"
                />
              </FormField>
            </div>
          ) : null}

          {step === 2 ? (
            <PlanSeatAllocator
              totalSeats={totalSeats}
              onTotalSeatsChange={setTotalSeats}
              rows={seatRows}
              onRowsChange={setSeatRows}
              usedByPlan={usedByPlan}
              showErrors={showErrors}
            />
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">
                  Billing term <span className="text-destructive">*</span>
                </legend>
                <div className="grid gap-3 sm:grid-cols-3" role="radiogroup">
                  {INSTITUTION_BILLING_TERMS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={term === t}
                      onClick={() => setTerm(t)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        term === t
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border/80 bg-card hover:border-primary/50",
                      )}
                    >
                      <span className="block text-sm font-semibold text-foreground">
                        {BILLING_TERM_LABELS[t]}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {BILLING_TERM_HINTS[t]}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
                <FormField
                  label="Planned go-live date"
                  htmlFor="onb-golive"
                  required={!isEdit}
                  hint="For records only. Billing starts when you mark the institute live."
                  error={showErrors ? billingErrors.plannedGoLive : undefined}
                >
                  <Input
                    id="onb-golive"
                    type="date"
                    value={plannedGoLive}
                    onChange={(e) => setPlannedGoLive(e.target.value)}
                    className="h-11"
                  />
                </FormField>
                <FormField
                  label="Grace period (days)"
                  htmlFor="onb-grace"
                  hint="Access continues this long after a missed renewal, then the account is suspended."
                  error={showErrors ? billingErrors.graceDays : undefined}
                >
                  <Input
                    id="onb-grace"
                    type="number"
                    min={0}
                    max={MAX_GRACE_DAYS}
                    value={graceDays}
                    onChange={(e) => setGraceDays(e.target.value.replace(/[^\d]/g, ""))}
                    className="h-11"
                  />
                </FormField>
                <FormField
                  label="Billing email"
                  htmlFor="onb-billing-email"
                  className="sm:col-span-2"
                  hint="Receives renewal reminders along with institute admins."
                  error={showErrors ? billingErrors.billingEmail : undefined}
                >
                  <Input
                    id="onb-billing-email"
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    placeholder="accounts@acme.edu"
                    className="h-11"
                  />
                </FormField>
              </div>
              {!isEdit ? (
                <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
                  The institute starts in <strong>demo mode</strong>: admins can add candidates
                  and set up batches, but candidates cannot run interviews until you mark it live.
                </p>
              ) : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Products for candidates</p>
                <p className="text-xs text-muted-foreground">
                  This is the ceiling. Institute admins can turn products off, but not on beyond this.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {INSTITUTION_PRODUCT_KEYS.map((key) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/80 bg-card px-3 py-2.5 text-sm hover:border-primary/40"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#7367F0]"
                        checked={products[key] !== false}
                        onChange={(e) =>
                          setProducts((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                      />
                      <span>{INSTITUTION_PRODUCT_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/80 bg-card px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[#7367F0]"
                  checked={biometric}
                  onChange={(e) => setBiometric(e.target.checked)}
                />
                <span>
                  Require biometric identity verification before interviews (institute candidates only)
                </span>
              </label>
              <InstitutionIntegrityFields settings={integrity} onChange={setIntegrity} />
            </div>
          ) : null}

          {step === 5 ? (
            <dl className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card text-sm">
              <ReviewRow label="Institute" value={name.trim() || "—"} />
              <ReviewRow label="Slug" value={slug.trim() || "Generated from name"} />
              <ReviewRow label="Contact" value={contactEmail.trim() || "—"} />
              <ReviewRow
                label="Seats"
                value={`${seatCheck.total} total · ${seatPayload
                  .filter((r) => r.purchased > 0)
                  .map((r) => `${r.purchased} ${seatPlanLabel(r.planId)}`)
                  .join(", ")}`}
              />
              <ReviewRow label="Billing term" value={BILLING_TERM_LABELS[term]} />
              <ReviewRow label="Planned go-live" value={formatLifecycleDate(plannedGoLive)} />
              <ReviewRow label="Grace period" value={`${graceNum} days`} />
              <ReviewRow
                label="Products"
                value={
                  INSTITUTION_PRODUCT_KEYS.filter((k) => products[k] !== false)
                    .map((k) => INSTITUTION_PRODUCT_LABELS[k])
                    .join(", ") || "None"
                }
              />
              <ReviewRow label="Biometric check" value={biometric ? "Required" : "Off"} />
            </dl>
          ) : null}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 border-t border-border/60 px-4 py-3 sm:flex-row sm:justify-between sm:px-6 sm:py-4">
          <Button
            variant="outline"
            className="h-11 w-full sm:w-auto"
            onClick={step === 1 ? () => onOpenChange(false) : goBack}
            disabled={submitting}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length ? (
            <Button className="h-11 w-full sm:w-auto" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button className="h-11 w-full sm:w-auto" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? "Save changes" : "Create institution"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}
