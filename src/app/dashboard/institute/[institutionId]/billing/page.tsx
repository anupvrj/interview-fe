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
import { Coins, CreditCard, ExternalLink, Receipt, ShieldCheck, Users } from "lucide-react";
import { userApi, adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  InstituteLoader,
  InstitutePageHeader,
  InstituteStatCard,
  InstituteTableShell,
  institutePanelClass,
} from "@/components/institute/InstituteChrome";

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
      adminApi.getInstitutionPayments(institutionId),
    ])
      .then(([d, p]) => {
        setDashboard(d);
        const rows = Array.isArray(p) ? p : p?.data ?? [];
        setPayments(rows);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile, institutionId]);

  if (!profile || loading) {
    return <InstituteLoader />;
  }

  const planCounts = dashboard?.planCounts || {};
  const planSeats = dashboard?.planSeats || [];
  const seatRows = (planSeats as Array<{ purchased: number; used: number }>).filter(
    (s) => s.purchased > 0 || s.used > 0,
  );
  const seatsPurchased = seatRows.reduce((n, s) => n + s.purchased, 0);
  const seatsUsed = seatRows.reduce((n, s) => n + s.used, 0);
  const creditsPool = dashboard?.creditsPool ?? 0;
  const userCount = dashboard?.userCount ?? 0;
  const maxUsers = dashboard?.institution?.maxUsers as number | null | undefined;

  return (
    <div className="space-y-8">
      <InstitutePageHeader
        hideBack
        title="Plans & payments"
        description="Purchased seat packs, member plan mix, credits across candidates, and institute payment history."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InstituteStatCard
          icon={ShieldCheck}
          label="Plan seats used"
          value={seatsPurchased > 0 ? `${seatsUsed} / ${seatsPurchased}` : "—"}
          footer={
            seatsPurchased > 0
              ? `${Math.round((seatsUsed / seatsPurchased) * 100)}% utilization · ${seatsPurchased - seatsUsed} open`
              : "No purchased seat packs"
          }
        />
        <InstituteStatCard
          icon={Users}
          label="Members enrolled"
          value={String(userCount)}
          footer={maxUsers != null ? `Institution cap ${maxUsers}` : "No member cap set"}
        />
        <InstituteStatCard
          icon={Coins}
          label="Credits pool"
          value={creditsPool.toLocaleString()}
          footer="Sum of available credits (all candidates)"
        />
        <InstituteStatCard
          icon={CreditCard}
          label="Active plan types"
          value={String(Object.keys(planCounts).length)}
          footer="Distribution by plan below"
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Seat quotas by plan</h2>
        <p className="text-sm text-muted-foreground">
          Purchased seats are allocated by Interview Trix. You can enroll candidates only while seats
          remain on each plan. Credits and features match consumer (B2C) plans.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {planSeats
            .filter((row: { purchased: number }) => row.purchased > 0)
            .map((row: { planId: string; purchased: number; used: number; remaining: number }) => (
              <InstituteStatCard
                key={row.planId}
                icon={Receipt}
                label={PLAN_LABELS[row.planId] || row.planId}
                value={`${row.used} / ${row.purchased}`}
                footer={`${row.remaining} remaining`}
              />
            ))}
          {planSeats.filter((r: { purchased: number }) => r.purchased > 0).length === 0 && (
            <Card className={cn(institutePanelClass, "sm:col-span-2")}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  No purchased seat packs yet. Contact your account manager or use member cap only.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Candidate plan mix</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(planCounts).map(([plan, count]) => (
            <InstituteStatCard
              key={plan}
              icon={CreditCard}
              label={PLAN_LABELS[plan] || plan}
              value={String(count)}
              footer="active members"
            />
          ))}
        </div>
      </section>

      <Card className={cn(institutePanelClass, "overflow-hidden shadow-xl")}>
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/40 to-card">
          <CardTitle>Recent payments</CardTitle>
          <CardDescription>
            Charges to this institution’s billing account (plans and credit purchases from your
            institution admin). Receipts and invoices for these transactions live here — not
            individual candidate subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {payments.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No institute payments recorded yet. When an institution admin completes checkout for a
              plan or credits, it will appear here.
            </p>
          ) : (
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
                      <TableRow
                        key={row._id || row.id}
                        className="border-border hover:bg-muted/40"
                      >
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
