"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { loadPendingJobHandoffPath } from "@/lib/extension-job-handoff";
import { useResumeExtensionHandoff } from "@/hooks/useResumeExtensionHandoff";
import { ArrowRight, Loader2 } from "lucide-react";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { userApi, type User } from "@/lib/api";
import {
  ROLE_META,
  deriveAvailableRoles,
  readStoredRole,
  roleHome,
  writeStoredRole,
  type ActiveRole,
} from "@/lib/roles";
import { cn } from "@/lib/utils";

export default function SelectRolePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<User | null>(null);
  const [roles, setRoles] = useState<ActiveRole[] | null>(null);

  const resumeCandidateWorkspace = useCallback(() => {
    if (user) writeStoredRole(user.id, "candidate");
  }, [user]);

  useResumeExtensionHandoff({
    enabled: Boolean(isLoaded && user),
    onBeforeRedirect: resumeCandidateWorkspace,
  });

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }

    const handoffPath = loadPendingJobHandoffPath();
    if (handoffPath) {
      writeStoredRole(user.id, "candidate");
      router.replace(handoffPath);
      return;
    }

    let cancelled = false;
    userApi
      .getMyProfile()
      .then((p) => {
        if (cancelled) return;
        const available = deriveAvailableRoles(p);
        const stored = readStoredRole(user.id);

        if (available.length <= 1) {
          const only = available[0] ?? "candidate";
          writeStoredRole(user.id, only);
          router.replace(roleHome(only, p));
          return;
        }
        if (stored && available.includes(stored)) {
          router.replace(roleHome(stored, p));
          return;
        }
        setProfile(p);
        setRoles(available);
      })
      .catch(() => {
        if (cancelled) return;
        writeStoredRole(user.id, "candidate");
        router.replace("/dashboard");
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, router]);

  const displayName = useMemo(
    () => user?.firstName?.trim() || user?.fullName?.trim() || "there",
    [user],
  );

  const choose = (role: ActiveRole) => {
    if (!user) return;
    writeStoredRole(user.id, role);
    router.replace(roleHome(role, profile));
  };

  if (!roles) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <InterviewTrixLogo
          variant="onLightBg"
          className="mb-6 h-8 w-auto dark:hidden"
        />
        <InterviewTrixLogo
          variant="white"
          className="mb-6 hidden h-8 w-auto dark:block"
        />
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Welcome back, {displayName}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          You have access to multiple workspaces. Choose how you&apos;d like to
          continue - you can switch anytime from the header or your profile menu.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {roles.map((role) => {
          const meta = ROLE_META[role];
          const Icon = meta.icon;
          return (
            <button
              key={role}
              type="button"
              onClick={() => choose(role)}
              className={cn(
                "group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all",
                "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              )}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-base font-semibold text-foreground">
                    {meta.label}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {meta.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
