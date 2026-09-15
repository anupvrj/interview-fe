export type CtcUnit = "lpa" | "inr";

export type Compensation = {
  amount: number;
  unit: CtcUnit;
};

export const CTC_UNIT_OPTIONS: { value: CtcUnit; label: string }[] = [
  { value: "lpa", label: "LPA" },
  { value: "inr", label: "INR" },
];

export function parseCompensationInput(
  amount: string,
  unit: CtcUnit,
): Compensation | undefined {
  const trimmed = amount.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return { amount: parsed, unit };
}

export function formatCompensation(value?: Compensation | null): string {
  if (!value || !Number.isFinite(value.amount) || value.amount < 0) {
    return "";
  }
  if (value.unit === "inr") {
    return `₹${Math.round(value.amount).toLocaleString("en-IN")}`;
  }
  return `${value.amount} LPA`;
}

export function compensationAmountInput(value?: Compensation | null): string {
  if (!value || !Number.isFinite(value.amount) || value.amount < 0) return "";
  return String(value.amount);
}

export function compensationUnit(value?: Compensation | null): CtcUnit {
  return value?.unit === "inr" ? "inr" : "lpa";
}
