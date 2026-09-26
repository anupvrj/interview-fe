"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Ban,
  CalendarClock,
  CreditCard,
  LayoutDashboard,
  Loader2,
  Pencil,
  Power,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SegmentedTabs, type SegmentedTab } from "@/components/institution-lifecycle/SegmentedTabs";
import {
  ActivityTimeline,
  BillingHistoryTable,
  BillingSummaryCard,
  lifecycleCardClass,
  SeatUsageCard,
} from "@/components/institution-lifecycle/BillingPanels";
import { ProductTogglesCard } from "@/components/institution-lifecycle/ProductTogglesCard";
import { StatusChangeDialog } from "@/components/institution-lifecycle/StatusChangeDialog";
import { AccountStatusBadge } from "@/components/institution-lifecycle/StatusBadges";
import {
  ExtendGraceDialog,
  MarkLiveDialog,
  RecordPaymentDialog,
} from "@/components/super-admin/institution-lifecycle/BillingActionDialogs";
import { InstitutionOnboardingWizard } from "@/components/super-admin/institution-onboarding/InstitutionOnboardingWizard";
import {
  adminApi,
  type AccountStatusEventRow,
  type InstitutionBillingStatus,
} from "@/lib/api";
import { formatLifecycleDate } from "@/lib/institution-lifecycle";

type Tab = "overview" | "seats" | "billing" | "features" | "status" | "activity";

const TABS: SegmentedTab<Tab>[] = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "seats", label: "Seats", icon: Users },
  { value: "billing", label: "Billing", icon: CreditCard },
  { value: "features", label: "Products", icon: SlidersHorizontal },
  { value: "status", label: "Status", icon: ShieldCheck },
  { value: "activity", label: "Activity", icon: Activity },
];

const TAB_VALUES = TABS.map((t) => t.value);

export default function SuperAdminInstitutionDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <InstitutionDetail />
    </Suspense>
  );
}

function InstitutionDetail() {
  const { institutionId } = useParams<{ institutionId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(initialTab && TAB_VALUES.includes(initialTab) ? initialTab : "overview");

  const [status, setStatus] = useState<InstitutionBillingStatus | null>(null);
  const [institutionDoc, setInstitutionDoc] = useState<any | null>(null);
  const [activity, setActivity] = useState<AccountStatusEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [goLiveOpen, setGoLiveOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [graceOpen, setGraceOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [notifyCandidates, setNotifyCandidates] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, list, events] = await Promise.all([
        adminApi.getInstitutionBillingStatus(institutionId),
        adminApi.listInstitutions(),
        adminApi.listInstitutionActivity(institutionId),
      ]);
      setStatus(s);
      setInstitutionDoc(list.find((i: any) => String(i._id) === institutionId) ?? null);
      setActivity(events);
    } catch (err) {
      console.error(err);
      toast.error("Could not load institution");
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeTab = (next: Tab) => {
    setTab(next);
    router.replace(`/super-admin/institutions/${institutionId}?tab=${next}`, { scroll: false });
  };

  const onBillingChanged = (next: InstitutionBillingStatus) => {
    setStatus(next);
    void adminApi.listInstitutionActivity(institutionId).then(setActivity).catch(() => undefined);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!status) {
    return (
      <div className="space-y-6">
        <SuperAdminPageHeader />
        <p className="text-sm text-muted-foreground">Institution not found.</p>
      </div>
    );
  }

  const { lifecycle, institution } = status;
  const isDemo = lifecycle.mode === "demo";
  const canRecordPayment = !isDemo && Boolean(status.billing.currentPeriodEnd);
  const canExtendGrace =
    canRecordPayment && ["overdue", "lapsed", "due_soon"].includes(lifecycle.billingState);

  const billingActions = (
    <>
      {isDemo ? (
        <Button className="h-10" onClick={() => setGoLiveOpen(true)}>
          <Rocket className="mr-2 h-4 w-4" />
          Mark live
        </Button>
      ) : null}
      {canRecordPayment ? (
        <Button className="h-10" onClick={() => setPaymentOpen(true)}>
          <CreditCard className="mr-2 h-4 w-4" />
          Record payment
        </Button>
      ) : null}
      {canExtendGrace ? (
        <Button variant="outline" className="h-10" onClick={() => setGraceOpen(true)}>
          <CalendarClock className="mr-2 h-4 w-4" />
          Extend grace
        </Button>
      ) : null}
    </>
  );

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title={institution.name}
        description={institution.contactEmail || institution.slug}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-10" onClick={() => setEditOpen(true)} disabled={!institutionDoc}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" className="h-10" asChild>
              <Link href={`/dashboard/institute/${institutionId}`}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Open dashboard
              </Link>
            </Button>
          </div>
        }
      />

      <SegmentedTabs tabs={TABS} value={tab} onChange={changeTab} ariaLabel="Institution sections" />

      {tab === "overview" ? (
        <div className="space-y-6">
          <BillingSummaryCard status={status} actions={billingActions} />
          <SeatUsageCard seats={status.seats} />
        </div>
      ) : null}

      {tab === "seats" ? (
        <SeatUsageCard
          seats={status.seats}
          actions={
            <Button variant="outline" className="h-10" onClick={() => setEditOpen(true)} disabled={!institutionDoc}>
              <Pencil className="mr-2 h-4 w-4" />
              Change seats
            </Button>
          }
        />
      ) : null}

      {tab === "billing" ? (
        <div className="space-y-6">
          <BillingSummaryCard status={status} actions={billingActions} />
          <BillingHistoryTable records={status.records} />
        </div>
      ) : null}

      {tab === "features" ? <ProductTogglesCard institutionId={institutionId} scope="super_admin" /> : null}

      {tab === "status" ? (
        <Card className={lifecycleCardClass}>
          <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
            <CardTitle className="text-base">Account status</CardTitle>
            <CardDescription>
              Suspending blocks every admin and candidate of this institute after sign-in. Data is kept.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <AccountStatusBadge status={lifecycle.effectiveStatus} />
              {institution.suspension?.at ? (
                <span className="text-sm text-muted-foreground">
                  since {formatLifecycleDate(institution.suspension.at)} ·{" "}
                  {institution.suspension.source === "auto_non_renewal" ? "non-renewal" : "manual"}
                </span>
              ) : null}
            </div>
            {institution.suspension?.reason ? (
              <p className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                {institution.suspension.reason}
              </p>
            ) : null}
            {lifecycle.lapsedPendingSuspension ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Grace period has ended. Access is already blocked; the automation will record the
                suspension on its next run.
              </p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              {institution.accountStatus === "active" ? (
                <Button variant="destructive" className="h-11" onClick={() => setStatusOpen(true)}>
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend or deactivate
                </Button>
              ) : (
                <Button className="h-11" onClick={() => setStatusOpen(true)}>
                  <Power className="mr-2 h-4 w-4" />
                  Change status
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "activity" ? (
        <Card className={lifecycleCardClass}>
          <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
            <CardTitle className="text-base">Activity</CardTitle>
            <CardDescription>Status changes, payments, and product updates for this institute and its candidates.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ActivityTimeline events={activity} />
          </CardContent>
        </Card>
      ) : null}

      <MarkLiveDialog open={goLiveOpen} onOpenChange={setGoLiveOpen} status={status} onDone={onBillingChanged} />
      <RecordPaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} status={status} onDone={onBillingChanged} />
      <ExtendGraceDialog open={graceOpen} onOpenChange={setGraceOpen} status={status} onDone={onBillingChanged} />
      <StatusChangeDialog
        open={statusOpen}
        onOpenChange={(o) => {
          setStatusOpen(o);
          if (!o) setNotifyCandidates(false);
        }}
        targetLabel={institution.name}
        currentStatus={institution.accountStatus}
        emailNote="Institute admins receive an email with this reason."
        extra={
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/80 bg-card px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#7367F0]"
              checked={notifyCandidates}
              onChange={(e) => setNotifyCandidates(e.target.checked)}
            />
            <span>Also email candidates when suspending or deactivating</span>
          </label>
        }
        onSubmit={async (next, reason) => {
          try {
            const s = await adminApi.setInstitutionStatus(institutionId, {
              status: next,
              reason,
              notifyCandidates,
            });
            toast.success("Institution status updated");
            onBillingChanged(s);
          } catch (err) {
            toast.error(
              (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "Could not update status",
            );
            throw err;
          }
        }}
      />
      <InstitutionOnboardingWizard
        open={editOpen}
        onOpenChange={setEditOpen}
        institution={institutionDoc}
        onSaved={load}
      />
    </div>
  );
}
