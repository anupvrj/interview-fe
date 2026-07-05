"use client";

import Link from "next/link";
import { Ban, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appPrimaryButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import type { RecruiterProfile } from "@/lib/api";

type RecruiterApplyStatusPanelProps = {
  profile: RecruiterProfile | null;
  variant?: "page" | "dialog";
  onStartApplication?: () => void;
};

export function RecruiterApplyStatusPanel({
  profile,
  variant = "page",
  onStartApplication,
}: Readonly<RecruiterApplyStatusPanelProps>) {
  const status = profile?.status;
  const compact = variant === "dialog";

  if (status === "pending") {
    return (
      <div className={cn("text-center", compact ? "px-2 py-6" : "p-8")}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/40">
          <Clock className="h-7 w-7" />
        </div>
        <h2 className={cn("font-semibold", compact ? "text-lg" : "text-xl")}>
          Application under review
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Thanks for applying to recruit on InterviewTrix. Our team is reviewing
          your details and you will be notified by email once approved.
        </p>
      </div>
    );
  }

  if (status === "suspended" || status === "blocked") {
    return (
      <div className={cn("text-center", compact ? "px-2 py-6" : "p-8")}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40">
          <Ban className="h-7 w-7" />
        </div>
        <h2 className={cn("font-semibold", compact ? "text-lg" : "text-xl")}>
          Account {status === "blocked" ? "blocked" : "suspended"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {profile?.suspensionReason ||
            "Your recruiter account is not active. Please contact info@interviewtrix.com."}
        </p>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className={cn("text-center", compact ? "px-2 py-6" : "p-8")}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className={cn("font-semibold", compact ? "text-lg" : "text-xl")}>
          You&apos;re approved
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Your recruiter account is active. Search and shortlist iX Talent from
          your dashboard.
        </p>
        <Button asChild className={cn(appPrimaryButton, "mt-6 h-11 px-6")}>
          <Link href="/dashboard/ix-recruiter">Open recruiter dashboard</Link>
        </Button>
      </div>
    );
  }

  if (status === "rejected") {
    return null;
  }

  if (onStartApplication && variant === "page") {
    return (
      <div className="flex flex-col items-start gap-4">
        <Button
          type="button"
          onClick={onStartApplication}
          className={cn(appPrimaryButton, "h-11 px-6")}
        >
          Start application
        </Button>
      </div>
    );
  }

  return null;
}
