import type { IntegrityReport } from "@/lib/integrity/types";

export type IntegrityStatus = NonNullable<IntegrityReport["integrityStatus"]>;

type IntegrityStatusSource = {
  integrityStatus?: IntegrityStatus;
  eventCount?: number;
  deductedPoints?: number;
  timeline?: unknown[] | null;
};

/**
 * Explicit status wins. Legacy reports without `integrityStatus` are scored
 * only when they have events or deductions — an empty 100 must not look verified.
 */
export function resolveIntegrityStatus(
  report: IntegrityStatusSource | null | undefined,
): IntegrityStatus {
  if (!report) return "missing";
  if (
    report.integrityStatus === "scored" ||
    report.integrityStatus === "missing" ||
    report.integrityStatus === "processing"
  ) {
    return report.integrityStatus;
  }
  const events = report.eventCount ?? report.timeline?.length ?? 0;
  const deducted = report.deductedPoints ?? 0;
  if (events > 0 || deducted > 0) return "scored";
  return "missing";
}
