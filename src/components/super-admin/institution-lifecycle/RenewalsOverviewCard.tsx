"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Ban, CalendarClock, FlaskConical, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi, type InstitutionRenewalRow, type InstitutionRenewalsOverview } from "@/lib/api";
import { formatLifecycleDate } from "@/lib/institution-lifecycle";
import { cn } from "@/lib/utils";

type Bucket = {
  key: keyof InstitutionRenewalsOverview;
  title: string;
  icon: typeof AlertTriangle;
  tone: string;
  empty: string;
  detail: (row: InstitutionRenewalRow) => string;
};

const BUCKETS: Bucket[] = [
  {
    key: "overdue",
    title: "Overdue",
    icon: AlertTriangle,
    tone: "text-[#EA5455] bg-[#EA5455]/10",
    empty: "No overdue institutes",
    detail: (r) => `${r.lifecycle.daysLeftInGrace ?? 0} day(s) left in grace`,
  },
  {
    key: "dueSoon",
    title: "Due in 15 days",
    icon: CalendarClock,
    tone: "text-[#FF9F43] bg-[#FF9F43]/10",
    empty: "Nothing due soon",
    detail: (r) => `Renews ${formatLifecycleDate(r.lifecycle.renewalDate)}`,
  },
  {
    key: "suspended",
    title: "Suspended",
    icon: Ban,
    tone: "text-[#a8aaae] bg-muted",
    empty: "No suspended institutes",
    detail: (r) =>
      r.lifecycle.lapsedPendingSuspension ? "Lapsed, suspending tonight" : "Suspended",
  },
  {
    key: "demo",
    title: "In demo",
    icon: FlaskConical,
    tone: "text-[#00BAD1] bg-[#00BAD1]/10",
    empty: "No institutes in demo",
    detail: (r) =>
      r.plannedGoLiveDate ? `Planned live ${formatLifecycleDate(r.plannedGoLiveDate)}` : "No planned date",
  },
];

/** Collections view for super admins: who to chase before automation suspends them. */
export function RenewalsOverviewCard() {
  const [data, setData] = useState<InstitutionRenewalsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getInstitutionRenewals()
      .then(setData)
      .catch((err) => console.error("renewals overview", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="rounded-xl border border-border/60 bg-card shadow-card">
      <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
        <CardTitle className="text-base sm:text-lg">Renewals</CardTitle>
        <CardDescription>
          Record payments before grace periods end. Unpaid institutes are suspended automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {BUCKETS.map((bucket) => {
              const rows = data?.[bucket.key] ?? [];
              const Icon = bucket.icon;
              return (
                <section
                  key={bucket.key}
                  className="flex min-w-0 flex-col rounded-xl border border-border/70 bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", bucket.tone)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {bucket.title}
                      </p>
                      <p className="text-xl font-semibold tabular-nums text-foreground">{rows.length}</p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm">
                    {rows.length === 0 ? (
                      <li className="text-xs text-muted-foreground">{bucket.empty}</li>
                    ) : (
                      rows.slice(0, 4).map((row) => (
                        <li key={row._id} className="min-w-0">
                          <Link
                            href={`/super-admin/institutions/${row._id}?tab=billing`}
                            className="block truncate font-medium text-foreground hover:text-primary"
                          >
                            {row.name}
                          </Link>
                          <span className="block truncate text-xs text-muted-foreground">
                            {bucket.detail(row)}
                          </span>
                        </li>
                      ))
                    )}
                    {rows.length > 4 ? (
                      <li className="text-xs text-muted-foreground">+{rows.length - 4} more</li>
                    ) : null}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
