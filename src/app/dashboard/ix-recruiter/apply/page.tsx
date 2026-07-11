"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Briefcase,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { RecruiterOnboardingForm } from "@/components/recruiter/RecruiterOnboardingForm";
import { recruiterApi, type RecruiterProfile } from "@/lib/api";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

const PERKS = [
  "Search and filter verified iX Talent by role, industry and iX Score",
  "View full candidate profiles, iX Reports and resumes",
  "Shortlist candidates and manage your hiring pipeline",
];

export default function RecruiterApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const p = await recruiterApi.getMyProfile();
      if (p?.status === "approved") {
        router.replace("/dashboard/ix-recruiter");
        return;
      }
      setProfile(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  const status = profile?.status;

  if (status === "pending") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className={cn(appCard, "p-8 text-center")}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/40">
            <Clock className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold">Application under review</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Thanks for applying to recruit on InterviewTrix. Our team is
            reviewing your details and you will be notified by email once
            approved.
          </p>
        </div>
      </div>
    );
  }

  if (status === "suspended" || status === "blocked") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className={cn(appCard, "p-8 text-center")}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40">
            <Ban className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold">
            Account {status === "blocked" ? "blocked" : "suspended"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {profile?.suspensionReason ||
              "Your recruiter account is not active. Please contact info@interviewtrix.com."}
          </p>
        </div>
      </div>
    );
  }

  if (showForm || status === "rejected") {
    return (
      <div className="space-y-6">
        {status === "rejected" ? (
          <div
            className={cn(
              appCard,
              "flex items-start gap-3 border-red-200/80 bg-red-50/50 p-4 dark:border-red-900/40 dark:bg-red-950/20",
            )}
          >
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Your previous application was not approved
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {profile?.rejectionReason ||
                  "Please review your details and reapply."}
              </p>
            </div>
          </div>
        ) : null}
        <RecruiterOnboardingForm onSubmitted={() => void load()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hire iX Talent"
        badge="For recruiters"
        description="Register as a recruiter to discover verified, interview-ready candidates on InterviewTrix."
      />
      <div className={cn(appCard, "overflow-hidden")}>
        <div className="grid gap-0 md:grid-cols-2">
          <div className="bg-gradient-to-br from-[#7367F0]/10 to-transparent p-6 sm:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#7367F0] text-white">
              <Briefcase className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">
              Why recruit on InterviewTrix?
            </h2>
            <ul className="mt-4 space-y-3">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-muted-foreground">{perk}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-start justify-center gap-4 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-medium text-[#7367F0]">
              <Sparkles className="h-4 w-4" />
              Individual or company — get verified in 24-48h
            </div>
            <p className="text-sm text-muted-foreground">
              Apply as an individual recruiter or on behalf of your company.
              Company applicants attach registration documents for verification.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#7367F0] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#6e62e5]"
            >
              Start application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
