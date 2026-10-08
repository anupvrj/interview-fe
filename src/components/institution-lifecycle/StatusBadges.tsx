import { cn } from "@/lib/utils";
import {
  appBadgeDanger,
  appBadgeInfo,
  appBadgeNeutral,
  appBadgeSuccess,
  appBadgeWarning,
} from "@/lib/app-theme";
import {
  ACCOUNT_STATUS_LABELS,
  BILLING_STATE_LABELS,
  type AccountStatus,
  type BillingState,
  type InstitutionMode,
} from "@/lib/institution-lifecycle";

const STATUS_CLASS: Record<AccountStatus, string> = {
  active: appBadgeSuccess,
  inactive: appBadgeNeutral,
  suspended: appBadgeDanger,
};

const BILLING_CLASS: Record<BillingState, string> = {
  demo: appBadgeInfo,
  not_configured: appBadgeNeutral,
  current: appBadgeSuccess,
  due_soon: appBadgeWarning,
  overdue: appBadgeDanger,
  lapsed: appBadgeDanger,
};

export function AccountStatusBadge({
  status,
  className,
}: Readonly<{ status?: AccountStatus | null; className?: string }>) {
  const s = status ?? "active";
  return <span className={cn(STATUS_CLASS[s], className)}>{ACCOUNT_STATUS_LABELS[s]}</span>;
}

export function InstitutionModeBadge({
  mode,
  className,
}: Readonly<{ mode?: InstitutionMode | null; className?: string }>) {
  const live = (mode ?? "live") === "live";
  return (
    <span className={cn(live ? appBadgeSuccess : appBadgeInfo, className)}>
      {live ? "Live" : "Demo"}
    </span>
  );
}

export function BillingStateBadge({
  state,
  className,
}: Readonly<{ state: BillingState; className?: string }>) {
  return <span className={cn(BILLING_CLASS[state], className)}>{BILLING_STATE_LABELS[state]}</span>;
}
