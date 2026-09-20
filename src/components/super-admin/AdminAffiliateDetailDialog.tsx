"use client";

import type { ReactNode } from "react";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { appTableShell } from "@/lib/app-theme";
import type { AdminAffiliateDetail } from "@/lib/api";
import { getReferralBaseUrl } from "@/lib/seo/site-url";
import { formatDate } from "@/lib/utils";

function rupees(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function payoutBadge(status: AdminAffiliateDetail["payouts"][number]["status"]) {
  if (status === "paid") return <Badge variant="success">Paid</Badge>;
  if (status === "rejected") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className={mono ? "break-all font-mono text-sm" : "text-sm"}>
        {value || "—"}
      </dd>
    </div>
  );
}

export function AdminAffiliateDetailDialog({
  open,
  loading,
  affiliate,
  onOpenChange,
}: {
  open: boolean;
  loading: boolean;
  affiliate: AdminAffiliateDetail | null;
  onOpenChange: (open: boolean) => void;
}) {
  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  };

  const referralUrl = affiliate
    ? `${getReferralBaseUrl(typeof window !== "undefined" ? window.location.origin : null)}${affiliate.referralPath}`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{affiliate?.name || affiliate?.email || "Affiliate profile"}</DialogTitle>
          <DialogDescription>
            Payout details, referral stats, and conversion history.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-[#7367F0]" />
          </div>
        )}

        {affiliate && !loading && (
          <div className="space-y-6">
            <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <h3 className="text-sm font-semibold">Account</h3>
              <dl className="space-y-2.5">
                <DetailRow label="Name" value={affiliate.name} />
                <DetailRow label="Email" value={affiliate.email} />
                <DetailRow label="Clerk ID" value={affiliate.clerkId} mono />
                <DetailRow
                  label="Status"
                  value={
                    affiliate.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )
                  }
                />
                <DetailRow label="Joined" value={formatDate(affiliate.createdAt)} />
              </dl>
            </section>

            <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <h3 className="text-sm font-semibold">Payout details</h3>
              <dl className="space-y-2.5">
                <DetailRow label="UPI ID" value={affiliate.upiId} mono />
                <DetailRow
                  label="Bank details"
                  value={
                    affiliate.bankDetails ? (
                      <span className="whitespace-pre-wrap">{affiliate.bankDetails}</span>
                    ) : null
                  }
                />
                <DetailRow
                  label="Available balance"
                  value={rupees(affiliate.availableBalance)}
                />
                <DetailRow
                  label="Lifetime earnings"
                  value={rupees(affiliate.totalEarnings)}
                />
              </dl>
            </section>

            <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <h3 className="text-sm font-semibold">Referral program</h3>
              <dl className="space-y-2.5">
                <DetailRow label="Referral code" value={affiliate.referralCode} mono />
                <DetailRow
                  label="Referral URL"
                  value={
                    <div className="flex flex-wrap items-start gap-2">
                      <span className="break-all font-mono text-xs">{referralUrl}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 shrink-0"
                        onClick={() => void copyText(referralUrl, "Referral URL")}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copy
                      </Button>
                    </div>
                  }
                />
                <DetailRow label="Total clicks" value={affiliate.totalClicks} />
                <DetailRow label="Conversions" value={affiliate.totalConversions} />
              </dl>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Payout history</h3>
              {affiliate.payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payout requests yet.</p>
              ) : (
                <div className={appTableShell}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>UPI</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliate.payouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>{rupees(payout.amountRequested)}</TableCell>
                          <TableCell className="font-mono text-xs">{payout.upiId}</TableCell>
                          <TableCell className="max-w-[160px] truncate text-xs">
                            {payout.bankDetails || "—"}
                          </TableCell>
                          <TableCell>{formatDate(payout.requestedAt)}</TableCell>
                          <TableCell>{payoutBadge(payout.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Conversions</h3>
              {affiliate.conversions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No paid conversions yet.</p>
              ) : (
                <div className={appTableShell}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referred user</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliate.conversions.map((conversion) => (
                        <TableRow key={conversion.id}>
                          <TableCell>
                            <div className="font-medium">
                              {conversion.referredName || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {conversion.referredEmail || conversion.referredClerkId}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {conversion.plan || "—"}
                            {conversion.billingCycle
                              ? ` · ${conversion.billingCycle}`
                              : ""}
                          </TableCell>
                          <TableCell>{rupees(conversion.paymentAmount)}</TableCell>
                          <TableCell>
                            {rupees(conversion.commissionAmount)} (
                            {conversion.commissionPercent}%)
                          </TableCell>
                          <TableCell>{formatDate(conversion.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
