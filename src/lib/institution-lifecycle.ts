/** Mirrors interview-core/src/services/institution/lifecycle.ts (keep rules in sync). */

export const INSTITUTION_BILLING_TERMS = ["monthly", "quarterly", "yearly"] as const;
export type InstitutionBillingTerm = (typeof INSTITUTION_BILLING_TERMS)[number];

export const BILLING_TERM_LABELS: Record<InstitutionBillingTerm, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export const BILLING_TERM_HINTS: Record<InstitutionBillingTerm, string> = {
  monthly: "Renews every month",
  quarterly: "Renews every 3 months",
  yearly: "Renews every 12 months",
};

export type AccountStatus = "active" | "inactive" | "suspended";
export type InstitutionMode = "demo" | "live";
export type BillingState =
  | "demo"
  | "not_configured"
  | "current"
  | "due_soon"
  | "overdue"
  | "lapsed";

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
};

export const BILLING_STATE_LABELS: Record<BillingState, string> = {
  demo: "Demo",
  not_configured: "Billing not set",
  current: "Current",
  due_soon: "Renewal due",
  overdue: "Overdue",
  lapsed: "Lapsed",
};

export const SEAT_ELIGIBLE_PLANS = [
  { planId: "tech_basic", label: "Tech Basic" },
  { planId: "tech_pro", label: "Tech Pro" },
  { planId: "enterprise", label: "Enterprise" },
] as const;
export type SeatEligiblePlanId = (typeof SEAT_ELIGIBLE_PLANS)[number]["planId"];

export function seatPlanLabel(planId: string): string {
  return SEAT_ELIGIBLE_PLANS.find((p) => p.planId === planId)?.label ?? planId;
}

export const DEFAULT_GRACE_DAYS = 7;
export const MAX_GRACE_DAYS = 60;

export type InstitutionLifecycle = {
  effectiveStatus: AccountStatus;
  storedStatus: AccountStatus;
  mode: InstitutionMode;
  billingState: BillingState;
  renewalDate: string | null;
  graceEndsAt: string | null;
  daysUntilRenewal: number | null;
  daysLeftInGrace: number | null;
  lapsedPendingSuspension: boolean;
};

export type InstitutionBillingInfo = {
  term: InstitutionBillingTerm;
  plannedGoLiveDate?: string | null;
  liveAt?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  graceDays: number;
  graceExtendedUntil?: string | null;
  graceExtensionReason?: string;
  billingEmail?: string;
  lastPaymentAt?: string | null;
};

export type SeatRowDraft = {
  key: string;
  planId: SeatEligiblePlanId | "";
  count: string;
};

export type SeatAllocationCheck = {
  total: number;
  allocated: number;
  remaining: number;
  errors: string[];
  rowErrors: Record<string, string>;
  valid: boolean;
};

/** Client-side mirror of validatePlanSeats plus per-row minimums (seats in use). */
export function checkSeatAllocation(
  totalRaw: string,
  rows: SeatRowDraft[],
  usedByPlan: Partial<Record<string, number>> = {},
): SeatAllocationCheck {
  const total = Number.parseInt(totalRaw, 10);
  const errors: string[] = [];
  const rowErrors: Record<string, string> = {};
  const validTotal = Number.isInteger(total) && total >= 1;
  if (!validTotal) errors.push("Enter total seats (at least 1).");

  let allocated = 0;
  const seen = new Set<string>();
  for (const row of rows) {
    if (!row.planId) {
      rowErrors[row.key] = "Choose a plan.";
      continue;
    }
    if (seen.has(row.planId)) {
      rowErrors[row.key] = "This plan is already added.";
      continue;
    }
    seen.add(row.planId);
    const n = Number.parseInt(row.count, 10);
    if (!Number.isInteger(n) || n < 0) {
      rowErrors[row.key] = "Enter a whole number.";
      continue;
    }
    const used = usedByPlan[row.planId] ?? 0;
    if (n < used) {
      rowErrors[row.key] = `At least ${used} (seats in use).`;
    }
    allocated += n;
  }

  for (const [planId, used] of Object.entries(usedByPlan)) {
    if (used && used > 0 && !seen.has(planId)) {
      errors.push(`${seatPlanLabel(planId)} has ${used} seats in use and cannot be removed.`);
    }
  }

  const remaining = validTotal ? total - allocated : 0;
  if (validTotal && rows.length === 0) errors.push("Add at least one seat plan.");
  if (validTotal && remaining < 0) {
    errors.push(`Allocated seats exceed the total by ${-remaining}.`);
  } else if (validTotal && remaining > 0 && rows.length > 0) {
    errors.push(`${remaining} seats still unallocated.`);
  }

  return {
    total: validTotal ? total : 0,
    allocated,
    remaining,
    errors,
    rowErrors,
    valid: validTotal && errors.length === 0 && Object.keys(rowErrors).length === 0,
  };
}

/** Max value a row may take so the split never exceeds the total. */
export function rowSeatMax(totalRaw: string, rows: SeatRowDraft[], rowKey: string): number | undefined {
  const total = Number.parseInt(totalRaw, 10);
  if (!Number.isInteger(total) || total < 1) return undefined;
  const others = rows
    .filter((r) => r.key !== rowKey)
    .reduce((acc, r) => acc + (Number.parseInt(r.count, 10) || 0), 0);
  return Math.max(0, total - others);
}

export function formatLifecycleDate(value?: string | Date | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

/** yyyy-mm-dd for <input type="date"> */
export function toDateInputValue(value?: string | Date | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export type AccessBlockCode =
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_INACTIVE"
  | "INSTITUTION_SUSPENDED"
  | "INSTITUTION_INACTIVE";

export const ACCESS_BLOCK_CODES: readonly AccessBlockCode[] = [
  "ACCOUNT_SUSPENDED",
  "ACCOUNT_INACTIVE",
  "INSTITUTION_SUSPENDED",
  "INSTITUTION_INACTIVE",
];

export function isAccessBlockCode(code: unknown): code is AccessBlockCode {
  return typeof code === "string" && (ACCESS_BLOCK_CODES as readonly string[]).includes(code);
}

export const SUPPORT_EMAIL = "info@interviewtrix.com";
