"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/app/FormField";
import { cn } from "@/lib/utils";
import { ACCOUNT_STATUS_LABELS, type AccountStatus } from "@/lib/institution-lifecycle";
import { AccountStatusBadge } from "./StatusBadges";

const STATUS_HINTS: Record<AccountStatus, string> = {
  active: "Full access restored.",
  suspended: "Blocked from signing in. Keeps their seat and data.",
  inactive: "Blocked and frees their seat. Use for people who have left.",
};

type Props = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. "Jane Doe" or "Acme Institute" */
  targetLabel: string;
  currentStatus?: AccountStatus | null;
  /** Statuses offered; defaults to all except the current one. */
  statuses?: AccountStatus[];
  /** Pre-selected status when the dialog opens. */
  initialStatus?: AccountStatus;
  /** Shown under the reason, e.g. a "notify candidates" checkbox. */
  extra?: ReactNode;
  emailNote?: string;
  onSubmit: (status: AccountStatus, reason: string) => Promise<void>;
}>;

/** Reason-required status change used for users, candidates, and institutes. */
export function StatusChangeDialog({
  open,
  onOpenChange,
  targetLabel,
  currentStatus,
  statuses,
  initialStatus,
  extra,
  emailNote = "The reason is included in the email we send.",
  onSubmit,
}: Props) {
  const current = currentStatus ?? "active";
  const options = (statuses ?? (["active", "suspended", "inactive"] as AccountStatus[])).filter(
    (s) => s !== current,
  );
  const [status, setStatus] = useState<AccountStatus>(initialStatus ?? options[0] ?? "suspended");
  const [reason, setReason] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStatus(initialStatus && initialStatus !== current ? initialStatus : options[0] ?? "suspended");
    setReason("");
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reasonError = reason.trim().length < 3 ? "Enter a reason (at least 3 characters)." : undefined;

  const submit = async () => {
    setShowErrors(true);
    if (reasonError) return;
    setSubmitting(true);
    try {
      await onSubmit(status, reason.trim());
      onOpenChange(false);
    } catch {
      // Caller shows the error toast; keep the dialog open for correction.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Change account status</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <span className="break-all font-medium text-foreground">{targetLabel}</span>
            <AccountStatusBadge status={current} />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">New status</legend>
            <div className="grid gap-2" role="radiogroup">
              {options.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    status === s
                      ? s === "active"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-destructive/60 bg-destructive/5 ring-1 ring-destructive/60"
                      : "border-border/80 bg-card hover:border-primary/50",
                  )}
                >
                  <span className="block text-sm font-semibold text-foreground">
                    {s === "active" ? "Reactivate" : ACCOUNT_STATUS_LABELS[s]}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{STATUS_HINTS[s]}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <FormField
            label="Reason"
            htmlFor="status-reason"
            required
            hint={emailNote}
            error={showErrors ? reasonError : undefined}
          >
            <Textarea
              id="status-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={
                status === "active" ? "e.g. Payment received" : "e.g. Violated exam integrity policy"
              }
            />
          </FormField>
          {extra}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="h-11"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="h-11"
            variant={status === "active" ? "default" : "destructive"}
            onClick={submit}
            disabled={submitting || options.length === 0}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {status === "active" ? "Reactivate" : `Mark ${ACCOUNT_STATUS_LABELS[status].toLowerCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
