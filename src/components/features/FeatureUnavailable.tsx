"use client";

import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FeatureUnavailable({
  title,
  message,
  backHref = "/dashboard",
  backLabel = "Back to dashboard",
}: {
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7367F0]/10 text-[#7367F0]">
        <ShieldOff className="h-7 w-7" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {title || "This feature is not available"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {message ||
          "This part of InterviewTrix is currently turned off. Please check back later."}
      </p>
      <Button asChild className={cn("mt-8")}>
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}
