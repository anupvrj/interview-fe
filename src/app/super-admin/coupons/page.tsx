"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Sparkles, Ticket, Trash2, Power } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { appCard, appPrimaryButton, appTableShell } from "@/lib/app-theme";
import { cn, formatDate } from "@/lib/utils";
import { adminApi, type AdminCoupon } from "@/lib/api";
import { apiErrorMessage } from "@/lib/api-errors";

function generateClientCode(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function statusVariant(
  status: AdminCoupon["status"],
): "success" | "warning" | "danger" | "neutral" {
  if (status === "active") return "success";
  if (status === "expired") return "warning";
  if (status === "exhausted") return "danger";
  return "neutral";
}

export default function SuperAdminCouponsPage() {
  const [list, setList] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isDefaultWelcome, setIsDefaultWelcome] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCoupon | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const items = await adminApi.listCoupons();
      setList(items);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to load coupons"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setCode("");
    setDiscountPercent("10");
    setMaxUses("");
    setExpiresAt("");
    setIsDefaultWelcome(false);
  };

  const handleCreate = async () => {
    const percent = Number(discountPercent);
    if (!Number.isInteger(percent) || percent < 1 || percent > 99) {
      toast.error("Discount must be a whole number from 1 to 99");
      return;
    }
    const trimmed = code.trim().toUpperCase();
    if (trimmed && !/^[A-Z0-9]{6}$/.test(trimmed)) {
      toast.error("Code must be exactly 6 alphanumeric characters");
      return;
    }

    setCreating(true);
    try {
      await adminApi.createCoupon({
        ...(trimmed ? { code: trimmed } : {}),
        discountPercent: percent,
        maxUses: maxUses.trim() ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isDefaultWelcome,
      });
      toast.success("Coupon created");
      setCreateOpen(false);
      resetForm();
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to create coupon"));
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (coupon: AdminCoupon) => {
    setActingId(coupon.id);
    try {
      await adminApi.updateCoupon(coupon.id, { isActive: !coupon.isActive });
      toast.success(coupon.isActive ? "Coupon deactivated" : "Coupon activated");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to update coupon"));
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActingId(deleteTarget.id);
    try {
      const result = await adminApi.deleteCoupon(deleteTarget.id);
      toast.success(
        result.deleted
          ? "Coupon deleted"
          : "Coupon deactivated because it has already been used",
      );
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to delete coupon"));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        actions={
          <Button
            className={cn(appPrimaryButton)}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New coupon
          </Button>
        }
      />

      <Card className={appCard}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Ticket className="h-4 w-4 text-[#7367F0]" />
            Coupon tracking
          </CardTitle>
          <CardDescription>
            Status, quota, and redemptions. Discounts apply to the first month
            only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 px-6 py-12 text-center">
              <Ticket className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                No coupons yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a 6-character code or generate one automatically.
              </p>
            </div>
          ) : (
            <div className={appTableShell}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Quota</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-semibold tracking-wide">
                        <Link
                          href={`/super-admin/coupons/${coupon.id}`}
                          className="text-[#7367F0] hover:underline"
                        >
                          {coupon.code}
                        </Link>
                        {coupon.isDefaultWelcome ? (
                          <Badge variant="info" className="ml-2">
                            Welcome
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>{coupon.discountPercent}%</TableCell>
                      <TableCell>
                        {coupon.quota === "unlimited"
                          ? "Unlimited"
                          : coupon.quota}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/super-admin/coupons/${coupon.id}`}
                          className="font-medium text-[#7367F0] hover:underline"
                        >
                          {coupon.usedCount}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {coupon.expiresAt
                          ? formatDate(coupon.expiresAt)
                          : "Evergreen"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(coupon.status)}>
                          {coupon.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actingId === coupon.id}
                            onClick={() => void handleToggle(coupon)}
                          >
                            {actingId === coupon.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Power className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-1.5">
                              {coupon.isActive ? "Disable" : "Enable"}
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            disabled={actingId === coupon.id}
                            onClick={() => setDeleteTarget(coupon)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="ml-1.5">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create coupon</DialogTitle>
            <DialogDescription>
              First-month subscription discount. Leave code blank to auto-generate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Code (6 alphanumeric)</Label>
              <div className="flex gap-2">
                <Input
                  id="coupon-code"
                  value={code}
                  maxLength={6}
                  placeholder="e.g. WELC10"
                  className="uppercase"
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCode(generateClientCode())}
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Generate
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-percent">Discount percentage</Label>
              <Input
                id="coupon-percent"
                type="number"
                min={1}
                max={99}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-max">Usage limit (optional)</Label>
              <Input
                id="coupon-max"
                type="number"
                min={1}
                placeholder="Leave empty for unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-expiry">Expiry date (optional)</Label>
              <Input
                id="coupon-expiry"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <label className="flex items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-border text-[#7367F0] accent-[#7367F0]"
                checked={isDefaultWelcome}
                onChange={(e) => setIsDefaultWelcome(e.target.checked)}
              />
              <span>
                <span className="font-medium text-foreground">
                  Default welcome discount
                </span>
                <span className="mt-0.5 block text-muted-foreground">
                  Auto-apply on a new user&apos;s first-month checkout without
                  entering a code.
                </span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              className={appPrimaryButton}
              disabled={creating}
              onClick={() => void handleCreate()}
            >
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete coupon?"
        description={
          deleteTarget?.usedCount
            ? `${deleteTarget.code} has already been used and will be deactivated instead of deleted.`
            : `This will permanently remove ${deleteTarget?.code ?? "this coupon"}.`
        }
        confirmText={deleteTarget?.usedCount ? "Deactivate" : "Delete"}
        variant="destructive"
        isLoading={actingId === deleteTarget?.id}
        onConfirm={handleDelete}
      />
    </div>
  );
}
