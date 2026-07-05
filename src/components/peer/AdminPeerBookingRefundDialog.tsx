"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { Textarea } from "@/components/ui/textarea";
import { peerApi } from "@/lib/api";

type AdminPeerBookingRefundDialogProps = {
  open: boolean;
  bookingId: string;
  amount: number;
  bookingRef: string;
  onOpenChange: (open: boolean) => void;
  onRefunded: () => void | Promise<void>;
};

export function AdminPeerBookingRefundDialog({
  open,
  bookingId,
  amount,
  bookingRef,
  onOpenChange,
  onRefunded,
}: Readonly<AdminPeerBookingRefundDialogProps>) {
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRefundType("full");
    setRefundAmount("");
    setRefundReason("");
  }, [open]);

  const doRefund = async () => {
    if (!refundReason.trim()) {
      toast.error("Enter a refund reason");
      return;
    }
    if (refundType === "partial" && (!refundAmount || Number(refundAmount) <= 0)) {
      toast.error("Enter a valid partial amount");
      return;
    }
    if (refundType === "partial" && Number(refundAmount) > amount) {
      toast.error(`Partial refund cannot exceed ₹${amount}`);
      return;
    }

    setActing(true);
    try {
      await peerApi.admin.refund(bookingId, {
        type: refundType,
        amount: refundType === "partial" ? Number(refundAmount) : undefined,
        reason: refundReason.trim(),
      });
      toast.success("Refund processed");
      onOpenChange(false);
      await onRefunded();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Refund failed");
    } finally {
      setActing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Refund candidate</DialogTitle>
          <DialogDescription>
            Issue a full or partial refund for booking {bookingRef}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="refund-type" className="text-xs font-medium text-muted-foreground">
              Refund type
            </Label>
            <AppSelect
              id="refund-type"
              value={refundType}
              onChange={(v) => setRefundType(v as "full" | "partial")}
              options={[
                { value: "full", label: `Full refund (₹${amount})` },
                { value: "partial", label: "Partial refund" },
              ]}
            />
          </div>

          {refundType === "partial" ? (
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="refund-amount" className="text-xs font-medium text-muted-foreground">
                Amount (₹)
              </Label>
              <Input
                id="refund-amount"
                type="number"
                min={1}
                max={amount}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder={`Max ₹${amount}`}
                className="h-11 bg-card"
              />
            </div>
          ) : null}

          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="refund-reason" className="text-xs font-medium text-muted-foreground">
              Reason
            </Label>
            <Textarea
              id="refund-reason"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Why is this refund being issued?"
              rows={3}
              className="bg-card"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={acting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => void doRefund()} disabled={acting}>
            {acting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Process refund
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
