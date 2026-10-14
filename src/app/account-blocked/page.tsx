"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { Loader2, LogOut, Mail, ShieldAlert } from "lucide-react";
import { AuthCardLayout } from "@/components/app/AuthCardLayout";
import { Button } from "@/components/ui/button";
import { userApi, type MyAccessState } from "@/lib/api";
import { SUPPORT_EMAIL } from "@/lib/institution-lifecycle";

const TITLES: Record<string, string> = {
  ACCOUNT_SUSPENDED: "Your account is suspended",
  ACCOUNT_INACTIVE: "Your account is inactive",
  INSTITUTION_SUSPENDED: "We can't let you in right now",
  INSTITUTION_INACTIVE: "We can't let you in right now",
};

export default function AccountBlockedPage() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [access, setAccess] = useState<MyAccessState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLoading(false);
      return;
    }
    localStorage.setItem("clerk-user-id", user.id);
    userApi
      .getMyAccess()
      .then(setAccess)
      .catch(() => setAccess(null))
      .finally(() => setLoading(false));
  }, [isLoaded, user]);

  if (loading) {
    return (
      <AuthCardLayout>
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthCardLayout>
    );
  }

  if (access?.allowed) {
    return (
      <AuthCardLayout title="You're all set" subtitle="Your account has access again.">
        <Button className="h-11 w-full" asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </AuthCardLayout>
    );
  }

  const code = access?.code ?? "";
  const isInstitution = access?.scope === "institution";
  const subject = encodeURIComponent(
    isInstitution ? `Access issue: ${access?.institution?.name ?? "my institute"}` : "Account access",
  );

  return (
    <AuthCardLayout
      title={TITLES[code] ?? "Access unavailable"}
      subtitle={
        access?.message ??
        "We are facing some issue while letting you in. Please reach out to your institute or write an email to InterviewTrix."
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 space-y-1">
            {access?.institution?.name ? (
              <p className="font-medium">{access.institution.name}</p>
            ) : null}
            {access?.reason ? <p className="break-words">{access.reason}</p> : null}
            <p className="text-red-800/80 dark:text-red-200/80">
              {isInstitution
                ? "Please contact your institute admin, or write to us and we'll help."
                : "If you think this is a mistake, write to us and we'll look into it."}
            </p>
          </div>
        </div>
        <Button className="h-11 w-full" asChild>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${subject}`}>
            <Mail className="mr-2 h-4 w-4" />
            Email {SUPPORT_EMAIL}
          </a>
        </Button>
        <Button
          variant="outline"
          className="h-11 w-full"
          onClick={() => {
            localStorage.removeItem("clerk-user-id");
            void signOut({ redirectUrl: "/sign-in" });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </AuthCardLayout>
  );
}
