"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Copy,
  IndianRupee,
  Loader2,
  MousePointerClick,
  Share2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { appCard, appPrimaryButton, appTableShell } from "@/lib/app-theme";
import { affiliateApi, type AffiliateStats } from "@/lib/api";
import { apiErrorMessage } from "@/lib/api-errors";
import { getReferralBaseUrl } from "@/lib/seo/site-url";
import { cn, formatDate } from "@/lib/utils";

function rupees(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function payoutBadge(status: AffiliateStats["payouts"][number]["status"]) {
  if (status === "paid") return <Badge variant="success">Paid</Badge>;
  if (status === "rejected") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

export default function AffiliateDashboardPage() {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [browserOrigin, setBrowserOrigin] = useState<string | null>(null);

  useEffect(() => {
    setBrowserOrigin(window.location.origin);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await affiliateApi.stats();
      setStats(data);
      setUpiId(data.upiId || "");
      setBankDetails(data.bankDetails || "");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to load affiliate stats"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!stats?.registered) return;
    const intervalId = setInterval(() => {
      void affiliateApi.stats().then(setStats).catch(() => undefined);
    }, 20_000);
    return () => clearInterval(intervalId);
  }, [stats?.registered]);

  const referralUrl = useMemo(() => {
    if (!stats?.referralPath) return "";
    return `${getReferralBaseUrl(browserOrigin)}${stats.referralPath}`;
  }, [stats?.referralPath, browserOrigin]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const data = await affiliateApi.register();
      setStats(data);
      toast.success("Your affiliate link is ready");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not generate your affiliate link"));
    } finally {
      setRegistering(false);
    }
  };

  const handleCopy = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast.success("Referral link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const handlePayout = async () => {
    if (!stats) return;
    if (stats.availableBalance < stats.minPayoutRupees) {
      toast.error(
        `Minimum payout is ${rupees(stats.minPayoutRupees)}. Your available balance is ${rupees(stats.availableBalance)}.`,
      );
      return;
    }
    setSubmittingPayout(true);
    try {
      const data = await affiliateApi.requestPayout({
        upiId: upiId.trim(),
        bankDetails: bankDetails.trim() || undefined,
      });
      setStats(data);
      setPayoutOpen(false);
      toast.success("Payout request submitted");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not submit payout request"));
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (!stats?.registered) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Affiliate program</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share InterviewTrix and earn commission on referred users&apos; first
            paid subscription.
          </p>
        </div>
        <Card className={appCard}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-[#7367F0]" />
              Become an affiliate
            </CardTitle>
            <CardDescription>
              Referred users get {stats?.referralDiscountPercent ?? 10}% off their
              first month. You earn {stats?.partnerCommissionPercent ?? 15}% of
              that first payment. Payouts start at{" "}
              {rupees(stats?.minPayoutRupees ?? 500)}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className={appPrimaryButton}
              onClick={() => void handleRegister()}
              disabled={registering}
            >
              {registering ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              Generate my link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Affiliate dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track clicks, conversions, and request payouts from your referral link.
          </p>
        </div>
        <Button
          className={appPrimaryButton}
          disabled={!stats.canRequestPayout}
          onClick={() => {
            if (!stats.canRequestPayout) {
              toast.error(
                stats.hasPendingPayout
                  ? "You already have a pending payout request"
                  : `Minimum payout is ${rupees(stats.minPayoutRupees)}`,
              );
              return;
            }
            setPayoutOpen(true);
          }}
        >
          <IndianRupee className="mr-2 h-4 w-4" />
          Request payout
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          theme="sky"
          label="Total clicks"
          value={stats.totalClicks}
          icon={MousePointerClick}
          hint="Unique visits to your link"
        />
        <DashboardStatCard
          theme="emerald"
          label="Total conversions"
          value={stats.totalConversions}
          icon={Users}
          hint="Paid first subscriptions"
        />
        <DashboardStatCard
          theme="amber"
          label="Current earnings"
          value={rupees(stats.availableBalance)}
          icon={IndianRupee}
          hint={`Lifetime ${rupees(stats.totalEarnings)}`}
        />
        <DashboardStatCard
          theme="violet"
          label="Offer details"
          value={`${stats.partnerCommissionPercent}% / ${stats.referralDiscountPercent}%`}
          icon={BadgePercent}
          hint="Your cut / new-user first month"
        />
      </div>

      <Card className={appCard}>
        <CardHeader>
          <CardTitle>Your referral link</CardTitle>
          <CardDescription>
            Share this URL. The first referral link a friend clicks (within 30
            days) gets credit for their subscription — later links do not
            override it.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1 break-all rounded-md border border-input bg-background px-3 py-2 font-mono text-sm leading-relaxed text-foreground">
            {referralUrl}
          </div>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => void handleCopy()}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        </CardContent>
      </Card>

      <Card className={appCard}>
        <CardHeader>
          <CardTitle>Payout history</CardTitle>
          <CardDescription>
            Requests are reviewed by Backend Team. Minimum payout is{" "}
            {rupees(stats.minPayoutRupees)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payout requests yet.</p>
          ) : (
            <div className={cn(appTableShell)}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>UPI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>{formatDate(payout.requestedAt)}</TableCell>
                      <TableCell>{rupees(payout.amountRequested)}</TableCell>
                      <TableCell>{payoutBadge(payout.status)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {payout.upiId}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Self-referrals, fake accounts, and prohibited advertising (including paid
        search on our brand terms) void commissions. InterviewTrix may withhold or
        reverse earnings if fraud is detected.
      </p>

      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request payout</DialogTitle>
            <DialogDescription>
              Available balance {rupees(stats.availableBalance)} will be submitted
              for review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="name@upi"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bankDetails">Bank details (optional)</Label>
              <Input
                id="bankDetails"
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                placeholder="Account name, number, IFSC"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutOpen(false)}>
              Cancel
            </Button>
            <Button
              className={appPrimaryButton}
              disabled={submittingPayout || !upiId.trim()}
              onClick={() => void handlePayout()}
            >
              {submittingPayout ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
