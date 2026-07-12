"use client";

import { useRouter } from "next/navigation";
import { Crown, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SubscriptionPlanSlug } from "@/lib/api";
import { cn } from "@/lib/utils";

const PLAN_LABELS: Record<string, string> = {
  general_pass: "General Pass",
  tech_basic: "Tech Basic",
  tech_pro: "Tech Pro",
};

type UpgradeUpsellDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  targetPlan: SubscriptionPlanSlug;
  preview?: React.ReactNode;
  onDismiss?: () => void;
};

export function UpgradeUpsellDialog({
  open,
  onOpenChange,
  title,
  description,
  targetPlan,
  preview,
  onDismiss,
}: UpgradeUpsellDialogProps) {
  const router = useRouter();
  const planLabel = PLAN_LABELS[targetPlan] ?? targetPlan;

  const handleUpgrade = () => {
    onOpenChange(false);
    if (targetPlan === "general_pass" || targetPlan === "tech_basic" || targetPlan === "tech_pro") {
      router.push(`/checkout?plan=${targetPlan}`);
    } else {
      router.push("/pricing");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border border-[#7367F0]/20 p-0 sm:max-w-lg">
        {preview && (
          <div className="relative max-h-32 overflow-hidden">
            <div className="pointer-events-none select-none blur-sm opacity-40">
              {preview}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}
        <div className="px-6 py-6">
          <DialogHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7367F0]/10">
              <Lock className="h-6 w-6 text-[#7367F0]" />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription className="pt-1 text-left">
              {description}
            </DialogDescription>
          </DialogHeader>
          <div
            className={cn(
              "mt-4 rounded-lg border border-[#7367F0]/20 bg-[#7367F0]/5 px-4 py-3",
            )}
          >
            <p className="flex items-center gap-2 text-sm font-medium">
              <Crown className="h-4 w-4 text-[#7367F0]" />
              Upgrade to {planLabel}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button size="lg" className="w-full" onClick={handleUpgrade}>
              Upgrade to {planLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => {
                onDismiss?.();
                onOpenChange(false);
              }}
            >
              Maybe later
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                onOpenChange(false);
                router.push("/pricing");
              }}
            >
              Compare all plans
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
