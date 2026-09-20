"use client";

import { useEffect, useState } from "react";
import { Shield, Sparkles } from "lucide-react";
import { BiometricRecorder } from "@/components/biometric/BiometricRecorder";
import { biometricApi, type BiometricCredential } from "@/lib/biometric/api";
import { userApi } from "@/lib/api";
import {
  biometricEnrollmentLabel,
  biometricEnrollmentState,
  isInstituteBiometricRequired,
} from "@/lib/institution-flags";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

function statusCopy(status: BiometricCredential["status"]) {
  switch (status) {
    case "pending":
      return "Uploaded — quality check is running.";
    case "in-review":
      return "Waiting for your institute TPO to verify this clip.";
    case "approved":
      return "Approved. Interview snapshots can match this credential.";
    case "human_verified":
      return "Verified by your institute. You can start interviews.";
    case "failed":
      return "Quality check failed. Record a clearer 15 second clip.";
    case "failed_by_admin":
      return "Your institute rejected this credential. Record again.";
    default:
      return status;
  }
}

function statusChipClass(status?: string | null) {
  const state = biometricEnrollmentState(status);
  if (state === "ready") return "border-sky-300/40 bg-sky-400/15 text-sky-50";
  if (state === "pending") return "border-white/25 bg-white/15 text-white";
  if (status === "failed" || status === "failed_by_admin") {
    return "border-rose-300/40 bg-rose-400/20 text-rose-50";
  }
  return "border-amber-300/40 bg-amber-400/20 text-amber-50";
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
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      {!studioOpen ? (
        <>
          <section className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(115,103,240,0.28)]">
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-br from-[#7367F0] via-[#6e62e5] to-indigo-800"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(52,211,153,0.35),transparent_42%),radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.3),transparent_38%)]"
            />
            <div className="relative z-10 space-y-3 p-4 sm:space-y-4 sm:p-6 lg:p-8">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/90 backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                  Identity
                </span>
                {!loading ? (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm",
                      statusChipClass(status),
                    )}
                  >
                    {biometricEnrollmentLabel(status)}
                  </span>
                ) : null}
              </div>
              <div className="min-w-0 max-w-2xl space-y-1.5 sm:space-y-2">
                <h1 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Verify it is you
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-white/85 sm:text-[0.9375rem]">
                  {requireIdCard
                    ? "Read the guide, then start. Your institute also needs an ID photo."
                    : "Read the three steps, then start when you are ready. The camera stays off until then."}
                </p>
              </div>
            </div>
          </section>

          {!loading && credential ? (
            <div
              className={cn(
                appCard,
                "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5",
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
                    {statusCopy(credential.status)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <section
        className={cn(
          appCard,
          studioOpen ? "overflow-hidden p-3 sm:p-6" : "p-4 sm:p-6",
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
