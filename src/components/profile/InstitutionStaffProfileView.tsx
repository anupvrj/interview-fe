"use client";

import { useEffect, useState } from "react";
import { Building2, Hash, Loader2, Mail, Shield, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi, type User } from "@/lib/api";
import { accessRoleLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { profileCardClass } from "@/components/profile/profile-styles";

type Props = Readonly<{
  profile: User;
}>;

function FieldRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 break-all text-sm font-semibold text-foreground">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export function InstitutionStaffProfileView({ profile }: Props) {
  const institutionId = profile.institutionId
    ? String(profile.institutionId)
    : "";
  const [institutionName, setInstitutionName] = useState<string | null>(null);
  const [loadingName, setLoadingName] = useState(Boolean(institutionId));

  useEffect(() => {
    if (!institutionId) {
      setInstitutionName(null);
      setLoadingName(false);
      return;
    }
    let cancelled = false;
    setLoadingName(true);
    void adminApi
      .getInstitutionDashboard(institutionId)
      .then((dash) => {
        if (cancelled) return;
        const name = String(
          (dash.institution as { name?: string } | undefined)?.name || "",
        ).trim();
        setInstitutionName(name || null);
      })
      .catch(() => {
        if (!cancelled) setInstitutionName(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingName(false);
      });
    return () => {
      cancelled = true;
    };
  }, [institutionId]);

  const roleLabel = accessRoleLabel(profile.accessRole);
  const firstName = profile.name?.trim().split(/\s+/)[0] || "there";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(115,103,240,0.22)]">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[#7367F0] via-[#6e62e5] to-indigo-900"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative z-10 flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
              Institution staff
            </p>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Your profile
            </h1>
            <p className="text-sm text-white/80">
              Hi {firstName} — account details for your institution workspace.
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
            <Shield className="h-4 w-4 text-white/90" aria-hidden />
            <span className="text-sm font-semibold text-white">{roleLabel}</span>
          </div>
        </div>
      </section>

      <Card className={cn(profileCardClass, "overflow-hidden")}>
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            Account details
          </CardTitle>
          <CardDescription className="mt-1 text-sm">
            Name, email, role, and institution membership for this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
          <FieldRow icon={UserIcon} label="Name" value={profile.name || "—"} />
          <FieldRow icon={Mail} label="Email" value={profile.email || "—"} />
          <FieldRow icon={Shield} label="Role" value={roleLabel} />
          <FieldRow
            icon={Building2}
            label="Institute name"
            value={
              loadingName
                ? "Loading…"
                : institutionName || (institutionId ? "—" : "Not assigned")
            }
          />
          <FieldRow
            icon={Hash}
            label="Institute ID"
            value={institutionId || "Not assigned"}
          />
          {loadingName ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7367F0]" />
              Loading institution details…
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
