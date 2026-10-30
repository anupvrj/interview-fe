"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { BiometricRecorder } from "@/components/biometric/BiometricRecorder";
import {
  biometricApi,
  biometricFailedCopy,
  isBiometricProcessorFailure,
  type BiometricCredential,
} from "@/lib/biometric/api";
import { userApi } from "@/lib/api";
import {
  biometricEnrollmentLabel,
  biometricEnrollmentState,
  isInstituteBiometricRequired,
} from "@/lib/institution-flags";
import { dash2026Scope, Eyebrow } from "@/components/dashboard-2026/ui";
import { cn } from "@/lib/utils";

function statusCopy(credential: BiometricCredential) {
  switch (credential.status) {
    case "pending":
      return "Uploaded — quality check is running.";
    case "in-review":
      return "Waiting for your institute TPO to verify this clip.";
    case "approved":
      return "Approved. Interview snapshots can match this credential.";
    case "human_verified":
      return "Verified by your institute. You can start interviews.";
    case "failed":
      return isBiometricProcessorFailure(credential)
        ? biometricFailedCopy(credential).body
        : "Quality check failed. Record a clearer 15 second clip.";
    case "failed_by_admin":
      return "Your institute rejected this credential. Record again.";
    default:
      return credential.status;
  }
}

function statusChipClass(status?: string | null) {
  const state = biometricEnrollmentState(status);
  if (state === "ready") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  if (state === "pending") return "border-primary/30 bg-primary/10 text-primary";
  if (status === "failed" || status === "failed_by_admin") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }
  return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

function credentialBannerClass(state: ReturnType<typeof biometricEnrollmentState>) {
  if (state === "ready") return "border-sky-500/25 bg-sky-500/[0.06]";
  if (state === "pending") return "border-[#7367F0]/20 bg-[#7367F0]/[0.05]";
  return "border-rose-500/25 bg-rose-500/[0.05]";
}

function credentialIconClass(state: ReturnType<typeof biometricEnrollmentState>) {
  if (state === "ready") return "border-sky-500/20 bg-sky-500/10 text-sky-600";
  if (state === "pending") return "border-[#7367F0]/20 bg-[#7367F0]/10 text-[#7367F0]";
  return "border-rose-500/20 bg-rose-500/10 text-rose-600";
}

export default function IdentityVerificationPage() {
  const [credential, setCredential] = useState<BiometricCredential | null>(null);
  const [requireIdCard, setRequireIdCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studioOpen, setStudioOpen] = useState(false);

  const load = async () => {
    try {
      const [mine, profile] = await Promise.all([
        biometricApi.getMine().catch(() => null),
        userApi.getMyProfile().catch(() => null),
      ]);
      setCredential(mine);
      setRequireIdCard(isInstituteBiometricRequired(profile));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const status = credential?.status ?? null;
  const state = biometricEnrollmentState(status);

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6")}>
      {!studioOpen ? (
        <>
          <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
            <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_10%_0%,rgba(115,103,240,.14),transparent_70%),radial-gradient(40%_60%_at_95%_30%,rgba(31,143,255,.10),transparent_70%)]" />
            <div className="relative p-6 md:p-9">
              <div className="flex flex-wrap items-center gap-3">
                <Eyebrow>IDENTITY</Eyebrow>
                {!loading ? (
                  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold", statusChipClass(status))}>
                    {biometricEnrollmentLabel(status)}
                  </span>
                ) : null}
              </div>
              <h1 className="text-balance mt-5 text-[32px] font-black leading-[1.03] tracking-[-0.05em] text-foreground sm:text-[42px] xl:text-[50px]">
                Verify it&apos;s you,{" "}
                <span className="bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] bg-clip-text text-transparent">in 15 seconds.</span>
              </h1>
              <p className="text-balance mt-4 max-w-[56ch] text-[15.5px] leading-relaxed text-muted-foreground md:text-[17px]">
                {requireIdCard
                  ? "Read the guide, then start. Your institute also needs an ID photo."
                  : "Read the three steps, then start when you are ready. The camera stays off until then."}
              </p>
            </div>
          </section>

          {!loading && credential ? (
            <div
              className={cn(
                "flex flex-col gap-3 rounded-[18px] border p-4 sm:flex-row sm:items-center sm:p-5",
                credentialBannerClass(state),
              )}
            >
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                    credentialIconClass(state),
                  )}
                >
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Current credential · {biometricEnrollmentLabel(status)}
                  </p>
                  <p className="mt-0.5 break-words text-sm leading-relaxed text-muted-foreground">
                    {statusCopy(credential)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <section
        className={cn(
          "rounded-[22px] border border-border bg-card",
          studioOpen ? "overflow-hidden p-3 sm:p-6" : "p-5 md:p-7",
        )}
      >
        <BiometricRecorder
          institutionId={requireIdCard ? "required" : null}
          onStudioChange={setStudioOpen}
          onUploaded={(next) => {
            setCredential(next);
          }}
        />
      </section>
    </div>
  );
}
