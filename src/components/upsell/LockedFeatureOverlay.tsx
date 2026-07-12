"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LockedFeatureBadge = "Trial" | "General Pass" | "Tech Basic" | "Tech Pro";

type LockedFeatureOverlayProps = {
  title: string;
  description: string;
  preview?: React.ReactNode;
  blur?: boolean;
  badge?: LockedFeatureBadge;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  className?: string;
};

export function LockedFeatureOverlay({
  title,
  description,
  preview,
  blur = true,
  badge,
  ctaLabel = "Upgrade to unlock",
  ctaHref,
  onCtaClick,
  className,
}: LockedFeatureOverlayProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {preview && (
        <div
          className={cn(
            "pointer-events-none select-none",
            blur && "blur-sm opacity-50",
          )}
          aria-hidden
        >
          {preview}
        </div>
      )}
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 p-8 text-center",
          preview
            ? "absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background/95 backdrop-blur-md"
            : "border border-dashed border-border/80 bg-muted/30",
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#7367F0]/30 bg-[#7367F0]/10 shadow-lg">
          <Lock className="h-7 w-7 text-[#7367F0]" />
        </div>
        {badge && (
          <span className="rounded-full border border-[#7367F0]/30 bg-[#7367F0]/10 px-3 py-1 text-xs font-semibold text-[#7367F0]">
            {badge} required
          </span>
        )}
        <div className="max-w-md space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {ctaHref ? (
          <Button asChild>
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        ) : (
          <Button onClick={onCtaClick}>{ctaLabel}</Button>
        )}
      </div>
    </div>
  );
}
