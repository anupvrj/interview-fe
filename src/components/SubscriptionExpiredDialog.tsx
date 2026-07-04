"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";

type SubscriptionExpiredDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

export function SubscriptionExpiredDialog({
  open,
  onOpenChange,
}: SubscriptionExpiredDialogProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-[#7367F0]/20 bg-card shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Subscription expired
          </DialogTitle>
          <DialogDescription className="pt-1 text-left text-muted-foreground">
            Your billing period ended and auto-renewal did not complete. Renew
            your plan to start new interview sessions and restore monthly
            credits.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse gap-2 pt-4 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              router.push("/dashboard/plan?renew=1");
            }}
            className={institutePrimaryClass}
          >
            Renew subscription
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
