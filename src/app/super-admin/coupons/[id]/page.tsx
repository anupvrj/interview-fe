"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Ticket, Users } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { DashboardInsightTile } from "@/components/dashboard/DashboardStatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { appCard, appTableShell } from "@/lib/app-theme";
import { adminApi, type AdminCouponDetail } from "@/lib/api";
import { apiErrorMessage } from "@/lib/api-errors";
import { PLAN_COLUMN_LABELS, type PaidPlanId } from "@/lib/pricingPageContent";
import { formatDate } from "@/lib/utils";

function planLabel(plan: string | null): string {
  if (!plan) return "Unknown";
  return PLAN_COLUMN_LABELS[plan as PaidPlanId] ?? plan;
}

function cycleLabel(cycle: AdminCouponDetail["redemptions"][number]["billingCycle"]) {
  if (cycle === "monthly") return "Monthly";
  if (cycle === "quarterly") return "Quarterly";
  if (cycle === "yearly") return "Yearly";
  return "—";
}

const PAGE_SIZE = 20;

export default function SuperAdminCouponDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [detail, setDetail] = useState<AdminCouponDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const data = await adminApi.getCoupon(id, {
          limit: PAGE_SIZE,
          skip: (page - 1) * PAGE_SIZE,
        });
        if (!cancelled) setDetail(data);
      } catch (err) {
        toast.error(apiErrorMessage(err, "Failed to load coupon redemptions"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, page]);

  if (loading && !detail) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-6">
        <SuperAdminPageHeader />
        <p className="text-sm text-muted-foreground">Coupon not found.</p>
      </div>
    );
  }

  const { coupon, redemptions, planBreakdown, total } = detail;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title={coupon.code}
        description={`${coupon.discountPercent}% first-month discount. ${coupon.usedCount} ${coupon.usedCount === 1 ? "user" : "users"} redeemed this code.`}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardInsightTile
          theme="purple"
          label="Redemptions"
          value={coupon.usedCount}
          description={
            coupon.quota === "unlimited"
              ? "Unlimited quota"
              : `${coupon.usedCount} of ${coupon.quota} used`
          }
        />
        {planBreakdown.length === 0 ? (
          <DashboardInsightTile
            theme="amber"
            label="Plans"
            value="—"
            description="No redemptions yet"
          />
        ) : (
          planBreakdown.map((row) => (
            <DashboardInsightTile
              key={row.plan}
              theme="emerald"
              label={planLabel(row.plan)}
              value={row.count}
              description="Users on this plan"
            />
          ))
        )}
      </div>

      <Card className={appCard}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-[#7367F0]" />
            Redemptions
          </CardTitle>
          <CardDescription>
            Each user can redeem an introductory coupon once. Amounts are first
            month only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {redemptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 px-6 py-12 text-center">
              <Ticket className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                No redemptions yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Users will appear here after a discounted first-month payment.
              </p>
            </div>
          ) : (
            <div className={appTableShell}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>List price</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Saved</TableHead>
                    <TableHead>Redeemed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptions.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">
                          {row.name || row.email || row.clerkId}
                        </p>
                        {row.name && row.email ? (
                          <p className="text-xs text-muted-foreground">
                            {row.email}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{planLabel(row.plan)}</Badge>
                      </TableCell>
                      <TableCell>{cycleLabel(row.billingCycle)}</TableCell>
                      <TableCell>
                        ₹{row.originalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{row.finalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ₹{row.discountAmount.toLocaleString()} ({row.discountPercent}%)
                      </TableCell>
                      <TableCell>{formatDate(row.redeemedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {total > PAGE_SIZE ? (
                <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                  <span>
                    {rangeStart}–{rangeEnd} of {total}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || loading}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        <Link href="/super-admin/coupons" className="text-[#7367F0] hover:underline">
          Back to all coupons
        </Link>
      </p>
    </div>
  );
}
