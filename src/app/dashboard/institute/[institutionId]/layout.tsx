"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  LayoutDashboard,
  Users,
  CalendarClock,
  Settings,
  Receipt,
  Layers,
  BarChart2,
  Loader2,
} from "lucide-react";
import { userApi, adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const nav = (base: string) => [
  { href: base, label: "Overview", icon: LayoutDashboard },
  { href: `${base}/candidates`, label: "Candidates", icon: Users },
  { href: `${base}/batches`, label: "Batches", icon: Layers },
  { href: `${base}/schedules`, label: "Schedules", icon: CalendarClock },
  { href: `${base}/analytics`, label: "Analytics", icon: BarChart2 },
  { href: `${base}/settings`, label: "Institution", icon: Settings },
  { href: `${base}/billing`, label: "Plans & payments", icon: Receipt },
];

export default function InstituteDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const institutionId = params.institutionId as string;
  const base = `/dashboard/institute/${institutionId}`;

  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [accessRole, setAccessRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await userApi.getMyProfile();
        if (cancelled) return;
        setAccessRole(p.accessRole || "user");
        if (p.accessRole === "institution_admin") {
          const mine = p.institutionId ? String(p.institutionId) : "";
          if (mine !== institutionId) {
            globalThis.location.replace("/dashboard");
            return;
          }
        } else if (p.accessRole !== "super_admin") {
          globalThis.location.replace("/dashboard");
          return;
        }

        const dash = await adminApi.getInstitutionDashboard(institutionId);
        if (!cancelled) {
          setTitle(String((dash.institution as { name?: string }).name || "Institution"));
        }
      } catch {
        if (!cancelled) globalThis.location.replace("/dashboard");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [institutionId]);

  if (!ready) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  /** Institution admins use the main app sidebar only (DashboardLayout); avoid duplicate nav. */
  if (accessRole === "institution_admin") {
    return (
      <div className="min-w-0 w-full max-w-7xl mx-auto space-y-6">{children}</div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <aside className="w-full shrink-0 rounded-xl border border-border bg-card p-4 shadow-sm lg:w-56">
        {accessRole === "super_admin" && (
          <Link
            href="/dashboard/super-admin"
            className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Super Admin
          </Link>
        )}
        <div className="mb-4 flex items-start gap-2 border-b border-border pb-4">
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Institution
            </p>
            <p className="font-semibold leading-tight text-foreground">{title || "…"}</p>
          </div>
        </div>
        <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
          {nav(base).map((item) => {
            const active =
              item.href === base
                ? pathname === base
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
