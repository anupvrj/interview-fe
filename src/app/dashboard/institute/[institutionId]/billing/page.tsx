"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Coins, CreditCard, ExternalLink, Users } from "lucide-react";
import { userApi, adminApi, type InstitutionBillingStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  InstituteLoader,
  InstitutePageHeader,
  InstituteStatCard,
  InstituteTableShell,
  institutePanelClass,
} from "@/components/institute/InstituteChrome";
import {
  BillingHistoryTable,
  BillingSummaryCard,
  SeatUsageCard,
} from "@/components/institution-lifecycle/BillingPanels";
import { InstituteBillingBanner } from "@/components/institution-lifecycle/InstituteBillingBanner";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  tech_basic: "Tech Basic",
  tech_pro: "Tech Pro",
  enterprise: "Enterprise",
  general_pass: "General Pass",
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  credit_purchase: "Credit purchase",
  renewal: "Renewal",
  subscription: "Subscription",
};

export default function InstituteBillingPage() {
  const params = useParams();
  const institutionId = params.institutionId as string;
  const [profile, setProfile] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [billing, setBilling] = useState<InstitutionBillingStatus | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.getMyProfile().then(setProfile).catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      adminApi.getInstitutionDashboard(institutionId),
      adminApi.getInstitutionPayments(institutionId).catch(() => []),
      adminApi.getInstitutionBillingStatus(institutionId).catch(() => null),
    ])
      .then(([d, p, b]) => {
        setDashboard(d);
        setPayments(Array.isArray(p) ? p : p?.data ?? []);
        setBilling(b);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile, institutionId]);

  if (!profile || loading) {
    return <InstituteLoader />;
  }

  const planCounts: Record<string, number> = dashboard?.planCounts || {};
  const creditsPool = dashboard?.creditsPool ?? 0;
  const userCount = dashboard?.userCount ?? 0;
  const activePlanCounts = Object.entries(planCounts).filter(([, n]) => n > 0);

  return (
    <div className="space-y-6 lg:space-y-8">
      <InstitutePageHeader
        hideBack
        title="Plans & billing"
        description="Your billing term, next renewal, seat quota, and payment history."
      />

      <InstituteBillingBanner
        lifecycle={billing?.lifecycle ?? dashboard?.lifecycle}
        institutionId={institutionId}
        showBillingLink={false}
      />

      {billing ? <BillingSummaryCard status={billing} /> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <InstituteStatCard
          icon={Users}
          label="Members enrolled"
          value={String(userCount)}
          footer={
            billing?.seats.totalSeats != null
              ? `${billing.seats.used} of ${billing.seats.totalSeats} seats in use`
              : "No seat cap set"
          }
        />
        <InstituteStatCard
          icon={Coins}
          label="Credits pool"
          value={creditsPool.toLocaleString()}
          footer="Refreshed for every candidate at each renewal"
        />
        <InstituteStatCard
          icon={CreditCard}
          label="Plans in use"
          value={String(activePlanCounts.length)}
          footer={
            activePlanCounts.map(([plan, n]) => `${n} ${PLAN_LABELS[plan] || plan}`).join(" · ") ||
            "No members yet"
          }
        />
      </div>

      {billing ? <SeatUsageCard seats={billing.seats} /> : null}

      {billing ? <BillingHistoryTable records={billing.records} /> : null}

      {payments.length > 0 ? (
        <Card className={cn(institutePanelClass, "overflow-hidden")}>
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-base">Online payments</CardTitle>
            <CardDescription>
              Card and UPI checkouts made by your institute admins for plans or credits.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <InstituteTableShell>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold text-foreground">Date</TableHead>
                    <TableHead className="hidden font-semibold text-foreground sm:table-cell">
                      Type
                    </TableHead>
                    <TableHead className="font-semibold text-foreground">Amount</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-foreground">Paid by</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((row: any) => {
                    const typeLabel =
                      (row.paymentType && PAYMENT_TYPE_LABEL[row.paymentType]) ||
                      row.paymentType ||
                      "—";
                    const payer =
                      row.payerName && row.userEmail
                        ? `${row.payerName} (${row.userEmail})`
                        : row.payerName ||
                          row.userEmail ||
                          row.name ||
                          row.clerkId ||
                          row.userId ||
                          "—";
                    const razorpayPaymentId = row.razorpayPaymentId as string | undefined;
                    const receiptUrl = razorpayPaymentId
                      ? `https://dashboard.razorpay.com/app/payments/${encodeURIComponent(razorpayPaymentId)}`
                      : null;
                    return (
                      <TableRow key={row._id || row.id} className="border-border hover:bg-muted/40">
                        <TableCell className="whitespace-nowrap text-foreground">
                          {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="hidden text-sm text-foreground sm:table-cell">
                          {typeLabel}
                        </TableCell>
                        <TableCell className="font-medium tabular-nums text-foreground">
                          {row.amount != null && row.currency
                            ? `${Number(row.amount).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} ${String(row.currency).toUpperCase()}`
                            : row.amount != null
                              ? String(row.amount)
                              : "—"}
                        </TableCell>
                        <TableCell className="capitalize text-foreground">{row.status || "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm" title={String(payer)}>
                          {payer}
                        </TableCell>
                        <TableCell className="text-right">
                          {receiptUrl && row.status === "paid" ? (
                            <a
                              href={receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                            >
                              Open
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </InstituteTableShell>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
