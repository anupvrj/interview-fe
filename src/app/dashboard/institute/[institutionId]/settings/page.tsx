"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  CreditCard,
  LayoutDashboard,
  Loader2,
  SlidersHorizontal,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InstitutePageHeader } from "@/components/institute/InstitutePageHeader";
import { InstituteTeamPanel, type InstituteStaffMember } from "@/components/institute/InstituteTeamPanel";
import { SegmentedTabs, type SegmentedTab } from "@/components/institution-lifecycle/SegmentedTabs";
import {
  ActivityTimeline,
  BillingHistoryTable,
  BillingSummaryCard,
  lifecycleCardClass,
  SeatUsageCard,
} from "@/components/institution-lifecycle/BillingPanels";
import { ProductTogglesCard } from "@/components/institution-lifecycle/ProductTogglesCard";
import { CandidateSelfStartCard } from "@/components/institution-lifecycle/CandidateSelfStartCard";
import {
  adminApi,
  userApi,
  type AccountStatusEventRow,
  type InstitutionBillingStatus,
  type PendingInvitation,
} from "@/lib/api";

type Tab = "overview" | "seats" | "billing" | "products" | "team" | "activity";

const TABS: SegmentedTab<Tab>[] = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "seats", label: "Seats", icon: Users },
  { value: "billing", label: "Billing", icon: CreditCard },
  { value: "products", label: "Products", icon: SlidersHorizontal },
  { value: "team", label: "Team", icon: UserPlus },
  { value: "activity", label: "Activity", icon: Activity },
];

const TAB_VALUES = TABS.map((t) => t.value);

export default function InstituteSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <InstituteSettings />
    </Suspense>
  );
}

function InstituteSettings() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const institutionId = params.institutionId as string;
  const initialTab = searchParams.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(
    initialTab && TAB_VALUES.includes(initialTab) ? initialTab : "overview",
  );

  const [profile, setProfile] = useState<{ accessRole?: string } | null>(null);
  const [status, setStatus] = useState<InstitutionBillingStatus | null>(null);
  const [activity, setActivity] = useState<AccountStatusEventRow[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [staff, setStaff] = useState<InstituteStaffMember[]>([]);
  const [pendingStaff, setPendingStaff] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    profile?.accessRole === "institution_admin" || profile?.accessRole === "super_admin";

  const loadStaff = useCallback(async () => {
    const [rows, invites] = await Promise.all([
      adminApi.listInstitutionStaff(institutionId),
      adminApi.listInstitutionInvitations(institutionId, { kind: "staff" }).catch(() => []),
    ]);
    const existing = new Set(rows.map((s) => s.email.toLowerCase()));
    setStaff(rows);
    setPendingStaff(invites.filter((inv) => !existing.has(inv.email.toLowerCase())));
  }, [institutionId]);

  useEffect(() => {
    userApi.getMyProfile().then(setProfile).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      adminApi.getInstitutionDashboard(institutionId),
      adminApi.getInstitutionBillingStatus(institutionId).catch(() => null),
      adminApi.listInstitutionActivity(institutionId).catch(() => []),
    ])
      .then(async ([d, billing, events]) => {
        const inst = d.institution as {
          name?: string;
          slug?: string;
          domain?: string | null;
          contactEmail?: string | null;
        };
        setName(inst.name ?? "");
        setSlug(inst.slug ?? "");
        setDomain(inst.domain ?? "");
        setContactEmail(inst.contactEmail ?? "");
        setStatus(billing);
        setActivity(events);
        if (isAdmin) await loadStaff();
      })
      .catch(() => toast.error("Failed to load institution"))
      .finally(() => setLoading(false));
  }, [profile, institutionId, isAdmin, loadStaff]);

  const changeTab = (next: Tab) => {
    setTab(next);
    router.replace(`/dashboard/institute/${institutionId}/settings?tab=${next}`, { scroll: false });
  };

  if (!profile || loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const profileCard = (
    <Card className={lifecycleCardClass}>
      <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
        <CardTitle className="text-base">Institution profile</CardTitle>
        <CardDescription>
          Name, slug, domain, and contact email are managed by a super admin.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</dt>
            <dd className="mt-1.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm font-semibold text-foreground">
              {name.trim() || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Slug</dt>
            <dd className="mt-1.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm font-semibold text-foreground">
              {slug.trim() || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Custom domain
            </dt>
            <dd className="mt-1.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm font-semibold text-foreground">
              {domain.trim() || "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contact email
            </dt>
            <dd className="mt-1.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm font-semibold text-foreground">
              {contactEmail.trim() || "—"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <InstitutePageHeader
        hideBack
        title={name.trim() || "Institution"}
        description={contactEmail.trim() || slug.trim() || "Institute settings"}
      />

      <SegmentedTabs tabs={TABS} value={tab} onChange={changeTab} ariaLabel="Institution sections" />

      {tab === "overview" ? (
        <div className="space-y-6">
          {status ? <BillingSummaryCard status={status} /> : null}
          {status ? <SeatUsageCard seats={status.seats} /> : null}
          {profileCard}
        </div>
      ) : null}

      {tab === "seats" && status ? <SeatUsageCard seats={status.seats} /> : null}
      {tab === "seats" && !status ? (
        <p className="text-sm text-muted-foreground">Seat usage is not available yet.</p>
      ) : null}

      {tab === "billing" ? (
        <div className="space-y-6">
          {status ? <BillingSummaryCard status={status} /> : null}
          {status ? <BillingHistoryTable records={status.records} /> : null}
        </div>
      ) : null}

      {tab === "products" && isAdmin ? (
        <div className="space-y-6">
          <ProductTogglesCard institutionId={institutionId} scope="institution_admin" />
          <CandidateSelfStartCard institutionId={institutionId} />
        </div>
      ) : null}
      {tab === "products" && !isAdmin ? (
        <p className="text-sm text-muted-foreground">Only institute admins can change products.</p>
      ) : null}

      {tab === "team" && isAdmin ? (
        <InstituteTeamPanel
          institutionId={institutionId}
          staff={staff}
          pendingStaff={pendingStaff}
          onReload={loadStaff}
        />
      ) : null}
      {tab === "team" && !isAdmin ? (
        <p className="text-sm text-muted-foreground">Only institute admins can manage the team.</p>
      ) : null}

      {tab === "activity" ? (
        <Card className={lifecycleCardClass}>
          <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
            <CardTitle className="text-base">Activity</CardTitle>
            <CardDescription>
              Status changes, payments, and product updates for this institute.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ActivityTimeline events={activity} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
