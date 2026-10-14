"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import { FormField } from "@/components/app/FormField";
import { cn } from "@/lib/utils";
import {
  checkSeatAllocation,
  rowSeatMax,
  SEAT_ELIGIBLE_PLANS,
  seatPlanLabel,
  type SeatRowDraft,
} from "@/lib/institution-lifecycle";

type Props = Readonly<{
  totalSeats: string;
  onTotalSeatsChange: (value: string) => void;
  rows: SeatRowDraft[];
  onRowsChange: (rows: SeatRowDraft[]) => void;
  /** Seats currently held per plan (edit mode); rows cannot go below these. */
  usedByPlan?: Partial<Record<string, number>>;
  showErrors?: boolean;
  disabled?: boolean;
}>;

let rowCounter = 0;
export function newSeatRow(planId: SeatRowDraft["planId"] = "", count = ""): SeatRowDraft {
  rowCounter += 1;
  return { key: `seat-row-${Date.now()}-${rowCounter}`, planId, count };
}

export function PlanSeatAllocator({
  totalSeats,
  onTotalSeatsChange,
  rows,
  onRowsChange,
  usedByPlan = {},
  showErrors = false,
  disabled = false,
}: Props) {
  const check = checkSeatAllocation(totalSeats, rows, usedByPlan);
  const usedPlanIds = new Set(rows.map((r) => r.planId).filter(Boolean));
  const availablePlans = SEAT_ELIGIBLE_PLANS.filter((p) => !usedPlanIds.has(p.planId));
  const canAddRow = !disabled && availablePlans.length > 0;
  const pct =
    check.total > 0 ? Math.min(100, Math.round((check.allocated / check.total) * 100)) : 0;
  const over = check.total > 0 && check.remaining < 0;

  const updateRow = (key: string, patch: Partial<SeatRowDraft>) => {
    onRowsChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    const next = availablePlans[0];
    if (!next) return;
    const remaining = Math.max(0, check.remaining);
    onRowsChange([...rows, newSeatRow(next.planId, remaining > 0 ? String(remaining) : "")]);
  };

  const removeRow = (key: string) => {
    onRowsChange(rows.filter((r) => r.key !== key));
  };

  return (
    <div className="space-y-5">
      <FormField
        label="Total seats purchased"
        htmlFor="seat-total"
        required
        hint="Total candidate seats the institute has bought. Split them across plans below."
        error={
          showErrors && !(Number.parseInt(totalSeats, 10) >= 1)
            ? "Enter total seats (at least 1)."
            : undefined
        }
      >
        <Input
          id="seat-total"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={totalSeats}
          disabled={disabled}
          onChange={(e) => onTotalSeatsChange(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="e.g. 100"
          className="h-11 w-full"
        />
      </FormField>

      <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium text-foreground">
            Allocated {check.allocated}
            {check.total > 0 ? ` of ${check.total}` : ""}
          </span>
          <span
            className={cn(
              "font-medium",
              over
                ? "text-destructive"
                : check.remaining === 0 && check.total > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground",
            )}
          >
            {check.total === 0
              ? "Set total seats first"
              : over
                ? `${-check.remaining} over the total`
                : `${check.remaining} remaining`}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              over ? "bg-destructive" : pct === 100 ? "bg-emerald-500" : "bg-primary",
            )}
            style={{ width: `${over ? 100 : pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No seat plans yet. Add a plan to start splitting seats.
          </p>
        ) : null}
        {rows.map((row, index) => {
          const used = row.planId ? usedByPlan[row.planId] ?? 0 : 0;
          const max = rowSeatMax(totalSeats, rows, row.key);
          const planOptions = SEAT_ELIGIBLE_PLANS.map((p) => ({
            value: p.planId,
            label: p.label,
            disabled: p.planId !== row.planId && usedPlanIds.has(p.planId),
          }));
          const rowError = showErrors ? check.rowErrors[row.key] : undefined;
          return (
            <div
              key={row.key}
              className="grid grid-cols-[minmax(7.5rem,9.5rem)_minmax(5rem,1fr)_auto] items-start gap-2 rounded-xl border border-border/80 bg-card p-3 sm:grid-cols-[minmax(10rem,13rem)_minmax(8rem,1fr)_auto] sm:gap-3 sm:p-4"
            >
              <FormField
                label={`Seat plan ${index + 1}`}
                htmlFor={`${row.key}-plan`}
                className="min-w-0"
              >
                <AppSelect
                  id={`${row.key}-plan`}
                  value={row.planId}
                  onChange={(value) =>
                    updateRow(row.key, { planId: value as SeatRowDraft["planId"] })
                  }
                  options={planOptions}
                  disabled={disabled || used > 0}
                  placeholder="Choose plan"
                  className="h-11 min-w-0"
                />
              </FormField>
              <FormField
                label="Seats"
                htmlFor={`${row.key}-count`}
                error={rowError}
                hint={used > 0 ? `${used} in use` : max != null ? `Max ${max}` : undefined}
                className="min-w-0"
              >
                <Input
                  id={`${row.key}-count`}
                  type="number"
                  inputMode="numeric"
                  min={used}
                  max={max}
                  step={1}
                  value={row.count}
                  disabled={disabled}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, "");
                    if (raw === "") {
                      updateRow(row.key, { count: "" });
                      return;
                    }
                    const n = Number.parseInt(raw, 10);
                    const capped = max != null ? Math.min(n, max) : n;
                    updateRow(row.key, { count: String(capped) });
                  }}
                  className="h-11 w-full"
                />
              </FormField>
              <div className="flex flex-col">
                <span className="mb-2 block h-3.5" aria-hidden />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeRow(row.key)}
                  disabled={disabled || used > 0}
                  title={used > 0 ? "Seats in use cannot be removed" : "Remove seat plan"}
                  aria-label={`Remove ${row.planId ? seatPlanLabel(row.planId) : "seat plan"}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full sm:w-auto"
        onClick={addRow}
        disabled={!canAddRow}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add seat plan
      </Button>

      {showErrors && check.errors.length > 0 ? (
        <ul className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {check.errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
