"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { AppSelect } from "@/components/ui/app-select";
import { FormField } from "@/components/app/FormField";
import { cn } from "@/lib/utils";
import {
  adminApi,
  type InstitutionBillingStatus,
  type InstitutionPaymentInput,
} from "@/lib/api";
import {
  BILLING_TERM_LABELS,
  formatLifecycleDate,
  toDateInputValue,
  type InstitutionBillingTerm,
} from "@/lib/institution-lifecycle";

const METHOD_OPTIONS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

const TERM_MONTHS: Record<InstitutionBillingTerm, number> = { monthly: 1, quarterly: 3, yearly: 12 };

/** Client preview of the backend addTerm (UTC, clamps to month end). */
function previewAddTerm(from: Date, term: InstitutionBillingTerm): Date {
  const m = from.getUTCMonth() + TERM_MONTHS[term];
  const y = from.getUTCFullYear() + Math.floor(m / 12);
  const month = ((m % 12) + 12) % 12;
  const last = new Date(Date.UTC(y, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, month, Math.min(from.getUTCDate(), last)));
}

type PaymentDraft = {
  amount: string;
  paidAt: string;
  method: string;
  reference: string;
  notes: string;
};

const emptyPayment = (): PaymentDraft => ({
  amount: "",
  paidAt: toDateInputValue(new Date()),
  method: "bank_transfer",
  reference: "",
  notes: "",
});

function toPaymentInput(d: PaymentDraft): InstitutionPaymentInput {
  return {
    amount: d.amount ? Number(d.amount) : undefined,
    paidAt: d.paidAt || undefined,
    method: d.method as InstitutionPaymentInput["method"],
    reference: d.reference.trim() || undefined,
    notes: d.notes.trim() || undefined,
  };
}

function PaymentFields({
  value,
  onChange,
  idPrefix,
  errors,
}: Readonly<{
  value: PaymentDraft;
  onChange: (next: PaymentDraft) => void;
  idPrefix: string;
  errors?: Partial<Record<keyof PaymentDraft, string>>;
}>) {
  const set = (patch: Partial<PaymentDraft>) => onChange({ ...value, ...patch });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label="Amount (INR)" htmlFor={`${idPrefix}-amount`} error={errors?.amount}>
        <Input
          id={`${idPrefix}-amount`}
          inputMode="decimal"
          value={value.amount}
          onChange={(e) => set({ amount: e.target.value.replace(/[^\d.]/g, "") })}
          placeholder="e.g. 250000"
          className="h-11"
        />
      </FormField>
      <FormField label="Payment date" htmlFor={`${idPrefix}-paid`} error={errors?.paidAt}>
        <Input
          id={`${idPrefix}-paid`}
          type="date"
          value={value.paidAt}
          max={toDateInputValue(new Date())}
          onChange={(e) => set({ paidAt: e.target.value })}
          className="h-11"
        />
      </FormField>
      <FormField label="Method" htmlFor={`${idPrefix}-method`}>
        <AppSelect
          id={`${idPrefix}-method`}
          value={value.method}
          onChange={(v) => set({ method: v })}
          options={METHOD_OPTIONS}
          className="h-11"
        />
      </FormField>
      <FormField
        label="Reference"
        htmlFor={`${idPrefix}-ref`}
        hint="UTR, cheque number, or invoice ID. Must be unique."
        error={errors?.reference}
      >
        <Input
          id={`${idPrefix}-ref`}
          value={value.reference}
          onChange={(e) => set({ reference: e.target.value })}
          className="h-11"
        />
      </FormField>
      <FormField label="Notes" htmlFor={`${idPrefix}-notes`} className="sm:col-span-2">
        <Textarea
          id={`${idPrefix}-notes`}
          value={value.notes}
          onChange={(e) => set({ notes: e.target.value })}
          rows={2}
          maxLength={1000}
        />
      </FormField>
    </div>
  );
}

function PeriodPreview({ start, end }: Readonly<{ start: Date; end: Date }>) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">New billing period</p>
      <p className="mt-0.5 text-muted-foreground">
        {formatLifecycleDate(start)} → <strong className="text-foreground">{formatLifecycleDate(end)}</strong>{" "}
        (next renewal)
      </p>
    </div>
  );
}

type DialogBase = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: InstitutionBillingStatus;
  onDone: (next: InstitutionBillingStatus) => void;
}>;

function apiError(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function MarkLiveDialog({ open, onOpenChange, status, onDone }: DialogBase) {
  const term = status.billing.term;
  const [liveAt, setLiveAt] = useState(toDateInputValue(new Date()));
  const [withPayment, setWithPayment] = useState(false);
  const [payment, setPayment] = useState<PaymentDraft>(emptyPayment);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLiveAt(toDateInputValue(new Date()));
    setWithPayment(false);
    setPayment(emptyPayment());
  }, [open]);

  const start = useMemo(() => new Date(`${liveAt || toDateInputValue(new Date())}T00:00:00Z`), [liveAt]);
  const end = useMemo(() => previewAddTerm(start, term), [start, term]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const next = await adminApi.markInstitutionLive(status.institution._id, {
        liveAt: liveAt || undefined,
        payment: withPayment ? toPaymentInput(payment) : undefined,
      });
      toast.success(`${status.institution.name} is live. Billing started.`);
      onDone(next);
      onOpenChange(false);
    } catch (err) {
      toast.error(apiError(err, "Could not mark the institute live"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Mark {status.institution.name} live</DialogTitle>
          <DialogDescription>
            Candidates can start interviews once the institute is live. Billing starts on the live
            date and renews {BILLING_TERM_LABELS[term].toLowerCase()}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField
            label="Live date"
            htmlFor="golive-date"
            hint={
              status.billing.plannedGoLiveDate
                ? `Planned: ${formatLifecycleDate(status.billing.plannedGoLiveDate)}`
                : "Defaults to today. Cannot be in the future."
            }
          >
            <Input
              id="golive-date"
              type="date"
              value={liveAt}
              max={toDateInputValue(new Date())}
              onChange={(e) => setLiveAt(e.target.value)}
              className="h-11"
            />
          </FormField>
          <PeriodPreview start={start} end={end} />
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/80 bg-card px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#7367F0]"
              checked={withPayment}
              onChange={(e) => setWithPayment(e.target.checked)}
            />
            <span>Record the first payment now</span>
          </label>
          {withPayment ? <PaymentFields idPrefix="golive" value={payment} onChange={setPayment} /> : null}
          <p className="text-xs text-muted-foreground">
            Candidates get their plan credits for this billing period, and institute admins get a
            go-live email.
          </p>
        </div>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button className="h-11" onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Mark live
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RevertToDemoDialog({ open, onOpenChange, status, onDone }: DialogBase) {
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const next = await adminApi.markInstitutionDemo(status.institution._id);
      toast.success(`${status.institution.name} is back in demo mode.`);
      onDone(next);
      onOpenChange(false);
    } catch (err) {
      toast.error(apiError(err, "Could not switch to demo mode"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Switch {status.institution.name} to demo?</DialogTitle>
          <DialogDescription>
            Candidates will see that the institute is still being set up, and product pages stay
            locked until you mark it live again. Billing history is kept.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button className="h-11" onClick={() => void submit()} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Switch to demo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RecordPaymentDialog({ open, onOpenChange, status, onDone }: DialogBase) {
  const { lifecycle, billing, institution } = status;
  const blocked = lifecycle.effectiveStatus === "suspended";
  const lapsed = blocked || lifecycle.billingState === "lapsed";
  const [payment, setPayment] = useState<PaymentDraft>(emptyPayment);
  const [periodMode, setPeriodMode] = useState<"continue" | "from_payment">(lapsed ? "from_payment" : "continue");
  const [reactivate, setReactivate] = useState(true);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPayment(emptyPayment());
    setPeriodMode(lapsed ? "from_payment" : "continue");
    setReactivate(true);
    setShowErrors(false);
  }, [open, lapsed]);

  const errors: Partial<Record<keyof PaymentDraft, string>> = {};
  if (!payment.amount && !payment.reference) errors.reference = "Enter an amount or a reference.";
  if (!payment.paidAt) errors.paidAt = "Pick the payment date.";

  const start = useMemo(() => {
    if (periodMode === "continue" && billing.currentPeriodEnd) return new Date(billing.currentPeriodEnd);
    return new Date(`${payment.paidAt || toDateInputValue(new Date())}T00:00:00Z`);
  }, [periodMode, billing.currentPeriodEnd, payment.paidAt]);
  const end = useMemo(() => previewAddTerm(start, billing.term), [start, billing.term]);

  const manualSuspension = institution.accountStatus === "suspended" && institution.suspension?.source === "manual";

  const submit = async () => {
    setShowErrors(true);
    if (Object.keys(errors).length) return;
    setSubmitting(true);
    try {
      const next = await adminApi.recordInstitutionPayment(institution._id, {
        ...toPaymentInput(payment),
        periodStartMode: periodMode,
        reactivate: manualSuspension ? reactivate : undefined,
      });
      toast.success("Payment recorded. Next renewal updated.");
      onDone(next);
      onOpenChange(false);
    } catch (err) {
      toast.error(apiError(err, "Could not record the payment"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Record renewal payment</DialogTitle>
          <DialogDescription>
            {institution.name} · {BILLING_TERM_LABELS[billing.term]} · current period ends{" "}
            {formatLifecycleDate(billing.currentPeriodEnd)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <PaymentFields
            idPrefix="pay"
            value={payment}
            onChange={setPayment}
            errors={showErrors ? errors : undefined}
          />
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">New period starts</legend>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
              {(
                [
                  { value: "continue", title: "From previous renewal date", hint: "No gap in the billing calendar" },
                  { value: "from_payment", title: "From payment date", hint: "Use after a lapse or suspension" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={periodMode === opt.value}
                  onClick={() => setPeriodMode(opt.value)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    periodMode === opt.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border/80 bg-card hover:border-primary/50",
                  )}
                >
                  <span className="block text-sm font-semibold text-foreground">{opt.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{opt.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <PeriodPreview start={start} end={end} />
          {institution.accountStatus === "suspended" && institution.suspension?.source === "auto_non_renewal" ? (
            <p className="rounded-lg border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200">
              This institute was suspended for non-renewal. Recording the payment reactivates it.
            </p>
          ) : null}
          {manualSuspension ? (
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/80 bg-card px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#7367F0]"
                checked={reactivate}
                onChange={(e) => setReactivate(e.target.checked)}
              />
              <span>Also lift the manual suspension</span>
            </label>
          ) : null}
        </div>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button className="h-11" onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExtendGraceDialog({ open, onOpenChange, status, onDone }: DialogBase) {
  const { lifecycle, institution, billing } = status;
  const [until, setUntil] = useState("");
  const [reason, setReason] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const minDate = toDateInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const maxDate = billing.currentPeriodEnd
    ? toDateInputValue(previewAddTerm(new Date(billing.currentPeriodEnd), "quarterly"))
    : undefined;

  useEffect(() => {
    if (!open) return;
    const base = lifecycle.graceEndsAt ? new Date(lifecycle.graceEndsAt) : new Date();
    const suggested = new Date(Math.max(base.getTime(), Date.now()) + 7 * 24 * 60 * 60 * 1000);
    setUntil(toDateInputValue(suggested));
    setReason("");
    setShowErrors(false);
  }, [open, lifecycle.graceEndsAt]);

  const errors = {
    until: !until ? "Pick a date." : until < minDate ? "Must be in the future." : maxDate && until > maxDate ? "At most 3 months past the renewal date." : undefined,
    reason: reason.trim().length < 3 ? "Enter a reason (at least 3 characters)." : undefined,
  };

  const submit = async () => {
    setShowErrors(true);
    if (errors.until || errors.reason) return;
    setSubmitting(true);
    try {
      const next = await adminApi.extendInstitutionGrace(institution._id, {
        until: new Date(`${until}T23:59:59`).toISOString(),
        reason: reason.trim(),
      });
      toast.success(`Access extended until ${formatLifecycleDate(next.lifecycle.graceEndsAt)}`);
      onDone(next);
      onOpenChange(false);
    } catch (err) {
      toast.error(apiError(err, "Could not extend the grace period"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Extend grace period</DialogTitle>
          <DialogDescription>
            Keep {institution.name} open while payment is on the way. Access currently ends{" "}
            {formatLifecycleDate(lifecycle.graceEndsAt)}. The billing period does not change.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField
            label="Keep access open until"
            htmlFor="grace-until"
            required
            error={showErrors ? errors.until : undefined}
          >
            <Input
              id="grace-until"
              type="date"
              value={until}
              min={minDate}
              max={maxDate}
              onChange={(e) => setUntil(e.target.value)}
              className="h-11"
            />
          </FormField>
          <FormField
            label="Reason"
            htmlFor="grace-reason"
            required
            hint="Saved in the billing history."
            error={showErrors ? errors.reason : undefined}
          >
            <Textarea
              id="grace-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. Finance confirmed payment by the 20th"
            />
          </FormField>
        </div>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button className="h-11" onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Extend access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
