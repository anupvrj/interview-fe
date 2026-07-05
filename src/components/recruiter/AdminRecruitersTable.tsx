"use client";

import { useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecruiterStatusBadge } from "@/components/recruiter/RecruiterStatusBadges";
import type { RecruiterProfile } from "@/lib/api";
import { cn } from "@/lib/utils";

export type AdminRecruiterStatusTab =
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "blocked";

const TABS: { key: AdminRecruiterStatusTab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "suspended", label: "Suspended" },
  { key: "blocked", label: "Blocked" },
  { key: "all", label: "All" },
];

export function AdminRecruitersTable({
  recruiters,
  statusTab,
  onStatusTabChange,
  onView,
  statusCounts,
}: Readonly<{
  recruiters: RecruiterProfile[];
  statusTab: AdminRecruiterStatusTab;
  onStatusTabChange: (tab: AdminRecruiterStatusTab) => void;
  onView: (id: string) => void;
  statusCounts: Record<AdminRecruiterStatusTab, number>;
}>) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recruiters.filter((r) => {
      if (statusTab !== "all" && r.status !== statusTab) return false;
      if (!q) return true;
      return (
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
        (r.companyName || "").toLowerCase().includes(q) ||
        r.workEmail.toLowerCase().includes(q)
      );
    });
  }, [recruiters, statusTab, search]);

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-border/60 px-3 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onStatusTabChange(t.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                statusTab === t.key
                  ? "bg-[#7367F0] text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {t.label}
              <span className="ml-1.5 opacity-70">{statusCounts[t.key]}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, company or email"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border/60 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
              <th className="px-5 py-3 text-left">Recruiter</th>
              <th className="px-5 py-3 text-left">Type</th>
              <th className="px-5 py-3 text-left">Company</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-muted-foreground"
                >
                  No recruiters found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r._id}
                  className="border-b border-border/60 hover:bg-muted/30"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-foreground">
                      {r.firstName} {r.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.workEmail}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 capitalize">{r.recruiterType}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {r.companyName || "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <RecruiterStatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onView(r._id)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Review
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
