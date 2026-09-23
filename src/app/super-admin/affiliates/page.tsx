"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { AdminAffiliateDetailDialog } from "@/components/super-admin/AdminAffiliateDetailDialog";
import { appCard, appPrimaryButton, appTableShell } from "@/lib/app-theme";
import {
  adminApi,
  type AdminAffiliate,
  type AdminAffiliateDetail,
  type AdminAffiliatePayout,
  type AffiliateProgramSettings,
} from "@/lib/api";
import { apiErrorMessage } from "@/lib/api-errors";
import { cn, formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

function rupees(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function payoutBadge(status: AdminAffiliatePayout["status"]) {
  if (status === "paid") return <Badge variant="success">Paid</Badge>;
  if (status === "rejected") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

export default function SuperAdminAffiliatesPage() {
  const [settings, setSettings] = useState<AffiliateProgramSettings | null>(null);
  const [referralDiscountPercent, setReferralDiscountPercent] = useState("10");
  const [partnerCommissionPercent, setPartnerCommissionPercent] = useState("15");
  const [minPayoutRupees, setMinPayoutRupees] = useState("500");
  const [savingRates, setSavingRates] = useState(false);

  const [affiliates, setAffiliates] = useState<AdminAffiliate[]>([]);
  const [affiliateTotal, setAffiliateTotal] = useState(0);
  const [affiliatePage, setAffiliatePage] = useState(1);
  const [affiliatesLoading, setAffiliatesLoading] = useState(true);

  const [payouts, setPayouts] = useState<AdminAffiliatePayout[]>([]);
  const [payoutTotal, setPayoutTotal] = useState(0);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<{
    payout: AdminAffiliatePayout;
    status: "paid" | "rejected";
  } | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileAffiliate, setProfileAffiliate] =
    useState<AdminAffiliateDetail | null>(null);

  const openAffiliateProfile = async (affiliateId: string) => {
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileAffiliate(null);
    try {
      const data = await adminApi.getAffiliate(affiliateId);
      setProfileAffiliate(data);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to load affiliate profile"));
      setProfileOpen(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await adminApi.getAffiliateSettings();
      setSettings(data);
      setReferralDiscountPercent(String(data.referralDiscountPercent));
      setPartnerCommissionPercent(String(data.partnerCommissionPercent));
      setMinPayoutRupees(String(data.minPayoutRupees ?? 500));
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to load program rates"));
    }
  };

  const loadAffiliates = async (page: number) => {
    setAffiliatesLoading(true);
    try {
      const data = await adminApi.listAffiliates({
        limit: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      });
      setAffiliates(data.items);
      setAffiliateTotal(data.total);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to load affiliates"));
    } finally {
      setAffiliatesLoading(false);
    }
  };

  const loadPayouts = async (page: number) => {
    setPayoutsLoading(true);
    try {
      const data = await adminApi.listAffiliatePayouts({
        limit: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        status: "pending",
      });
      setPayouts(data.items);
      setPayoutTotal(data.total);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to load payout requests"));
    } finally {
      setPayoutsLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  useEffect(() => {
    void loadAffiliates(affiliatePage);
  }, [affiliatePage]);

  useEffect(() => {
    void loadPayouts(payoutPage);
  }, [payoutPage]);

  const handleSaveRates = async () => {
    const referral = Number(referralDiscountPercent);
    const partner = Number(partnerCommissionPercent);
    const minPayout = Number(minPayoutRupees);
    if (
      !Number.isInteger(referral) ||
      referral < 0 ||
      referral > 99 ||
      !Number.isInteger(partner) ||
      partner < 0 ||
      partner > 99
    ) {
      toast.error("Percents must be whole numbers from 0 to 99");
      return;
    }
    if (!Number.isInteger(minPayout) || minPayout < 1) {
      toast.error("Minimum payout must be a whole number of at least ₹1");
      return;
    }
    setSavingRates(true);
    try {
      const data = await adminApi.updateAffiliateSettings({
        referralDiscountPercent: referral,
        partnerCommissionPercent: partner,
        minPayoutRupees: minPayout,
      });
      setSettings(data);
      toast.success("Program settings updated");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save program rates"));
    } finally {
      setSavingRates(false);
    }
  };

  const handleReview = async () => {
    if (!reviewTarget) return;
    setReviewing(true);
    try {
      await adminApi.reviewAffiliatePayout(reviewTarget.payout.id, {
        status: reviewTarget.status,
      });
      toast.success(
        reviewTarget.status === "paid"
          ? "Payout marked as paid"
          : "Payout request rejected",
      );
      setReviewTarget(null);
      void loadPayouts(payoutPage);
      void loadAffiliates(affiliatePage);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update payout"));
    } finally {
      setReviewing(false);
    }
  };

  const affiliatePages = Math.max(1, Math.ceil(affiliateTotal / PAGE_SIZE));
  const payoutPages = Math.max(1, Math.ceil(payoutTotal / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader />

      <Card className={appCard}>
        <CardHeader>
          <CardTitle>Program settings</CardTitle>
          <CardDescription>
            Discount, commission, and payout floor apply to new activity. Past
            conversions keep rates snapshotted on the order.
            {settings?.updatedAt
              ? ` Last saved ${formatDate(settings.updatedAt)}.`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="referralDiscountPercent">
              New-user first-month discount %
            </Label>
            <Input
              id="referralDiscountPercent"
              type="number"
              min={0}
              max={99}
              value={referralDiscountPercent}
              onChange={(e) => setReferralDiscountPercent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="partnerCommissionPercent">
              Affiliate partner commission %
            </Label>
            <Input
              id="partnerCommissionPercent"
              type="number"
              min={0}
              max={99}
              value={partnerCommissionPercent}
              onChange={(e) => setPartnerCommissionPercent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minPayoutRupees">Minimum payout (₹)</Label>
            <Input
              id="minPayoutRupees"
              type="number"
              min={1}
              value={minPayoutRupees}
              onChange={(e) => setMinPayoutRupees(e.target.value)}
            />
          </div>
          <Button
            className={cn(appPrimaryButton, "sm:mb-0.5")}
            disabled={savingRates}
            onClick={() => void handleSaveRates()}
          >
            {savingRates ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save rates
          </Button>
        </CardContent>
      </Card>

      <Card className={appCard}>
        <CardHeader>
          <CardTitle>Pending payouts</CardTitle>
          <CardDescription>
            Mark a request paid after you transfer funds, or reject it to restore
            the affiliate balance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payoutsLoading && payouts.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
            </div>
          ) : payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending payouts.</p>
          ) : (
            <div className={appTableShell}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>UPI</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <button
                          type="button"
                          className="text-left hover:underline"
                          onClick={() => void openAffiliateProfile(payout.affiliateId)}
                        >
                          <div className="font-medium text-[#7367F0]">
                            {payout.name || "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {payout.email || payout.clerkId}
                          </div>
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payout.referralCode || "—"}
                      </TableCell>
                      <TableCell>{rupees(payout.amountRequested)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {payout.upiId}
                      </TableCell>
                      <TableCell>{formatDate(payout.requestedAt)}</TableCell>
                      <TableCell>{payoutBadge(payout.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className={appPrimaryButton}
                            onClick={() =>
                              setReviewTarget({ payout, status: "paid" })
                            }
                          >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Paid
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setReviewTarget({ payout, status: "rejected" })
                            }
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {payoutPages > 1 ? (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={payoutPage <= 1}
                onClick={() => setPayoutPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {payoutPage} of {payoutPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={payoutPage >= payoutPages}
                onClick={() =>
                  setPayoutPage((p) => Math.min(payoutPages, p + 1))
                }
              >
                Next
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className={appCard}>
        <CardHeader>
          <CardTitle>Affiliate partners</CardTitle>
          <CardDescription>
            {affiliateTotal} registered partner{affiliateTotal === 1 ? "" : "s"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {affiliatesLoading && affiliates.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
            </div>
          ) : affiliates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No affiliates yet. Partners generate a link from Dashboard →
              Affiliate.
            </p>
          ) : (
            <div className={appTableShell}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <button
                          type="button"
                          className="text-left hover:underline"
                          onClick={() => void openAffiliateProfile(row.id)}
                        >
                          <div className="font-medium text-[#7367F0]">
                            {row.name || "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.email || row.clerkId}
                          </div>
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.referralCode}
                      </TableCell>
                      <TableCell>{row.totalClicks}</TableCell>
                      <TableCell>{row.totalConversions}</TableCell>
                      <TableCell>{rupees(row.totalEarnings)}</TableCell>
                      <TableCell>{rupees(row.availableBalance)}</TableCell>
                      <TableCell>{formatDate(row.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {affiliatePages > 1 ? (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={affiliatePage <= 1}
                onClick={() => setAffiliatePage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {affiliatePage} of {affiliatePages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={affiliatePage >= affiliatePages}
                onClick={() =>
                  setAffiliatePage((p) => Math.min(affiliatePages, p + 1))
                }
              >
                Next
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AdminAffiliateDetailDialog
        open={profileOpen}
        loading={profileLoading}
        affiliate={profileAffiliate}
        onOpenChange={setProfileOpen}
      />

      <ConfirmationDialog
        open={Boolean(reviewTarget)}
        onOpenChange={(open) => {
          if (!open) setReviewTarget(null);
        }}
        title={
          reviewTarget?.status === "paid"
            ? "Mark this payout as paid?"
            : "Reject this payout request?"
        }
        description={
          reviewTarget?.status === "paid"
            ? `Confirm that ${rupees(reviewTarget.payout.amountRequested)} has been transferred to ${reviewTarget.payout.upiId}.`
            : `This will restore ${rupees(reviewTarget?.payout.amountRequested ?? 0)} to the affiliate available balance.`
        }
        confirmText={reviewTarget?.status === "paid" ? "Mark paid" : "Reject"}
        variant={reviewTarget?.status === "rejected" ? "destructive" : "default"}
        isLoading={reviewing}
        onConfirm={() => void handleReview()}
      />
    </div>
  );
}
