"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Eye, Loader2, Search, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { InterviewerStatusBadge } from "@/components/peer/InterviewerStatusBadge";
import { instituteSecondaryClass } from "@/components/institute/InstituteChrome";
import { appFilterBar, appTableShell } from "@/lib/app-theme";
import type { PeerInterviewerProfile } from "@/lib/api";
import { cn } from "@/lib/utils";

export const ADMIN_INTERVIEWER_STATUS_TABS = [
  "all",
  "pending",
  "approved",
  "rejected",
  "suspended",
  "blocked",
] as const;

export type AdminInterviewerStatusTab = (typeof ADMIN_INTERVIEWER_STATUS_TABS)[number];

export type AdminInterviewerSearchField = "name" | "company" | "email";

const SEARCH_FIELD_OPTIONS: { value: AdminInterviewerSearchField; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "company", label: "Company" },
  { value: "email", label: "Email" },
];

const SEARCH_PLACEHOLDERS: Record<AdminInterviewerSearchField, string> = {
  name: "Search by name…",
  company: "Search by company…",
  email: "Search by email…",
};

function matchesSearchField(
  profile: PeerInterviewerProfile,
  query: string,
  field: AdminInterviewerSearchField,
) {
  if (!query) return true;
  const q = query.toLowerCase();
  switch (field) {
    case "name":
      return profile.name.toLowerCase().includes(q);
    case "company":
      return profile.company.toLowerCase().includes(q);
    case "email":
      return profile.workEmail.toLowerCase().includes(q);
  }
}

const TAB_LABELS: Record<AdminInterviewerStatusTab, string> = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
  blocked: "Blocked",
};

function TableShell({
  headers,
  children,
}: Readonly<{ headers: readonly string[]; children: ReactNode }>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border/70">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: Readonly<{ title: string; description: string }>) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#7367F0]/10">
        <Users className="h-7 w-7 text-[#7367F0]" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

type AdminPeerInterviewersTableProps = {
  interviewers: PeerInterviewerProfile[];
  loading?: boolean;
  statusTab: AdminInterviewerStatusTab;
  onStatusTabChange: (tab: AdminInterviewerStatusTab) => void;
  onView: (id: string) => void;
  statusCounts: Record<AdminInterviewerStatusTab, number>;
};

export function AdminPeerInterviewersTable({
  interviewers,
  loading = false,
  statusTab,
  onStatusTabChange,
  onView,
  statusCounts,
}: Readonly<AdminPeerInterviewersTableProps>) {
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<AdminInterviewerSearchField>("name");

  const filtered = useMemo(() => {
    const q = search.trim();
    return interviewers
      .filter((p) => statusTab === "all" || p.status === statusTab)
      .filter((p) => matchesSearchField(p, q, searchField))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [interviewers, statusTab, search, searchField]);

  const hasActiveFilters = statusTab !== "all" || Boolean(search.trim());

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  return (
    <>
      <div className={cn(appFilterBar, "mx-5 mt-4 space-y-3")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="admin-interviewer-search-field" className="text-xs font-medium text-muted-foreground">
              Search by
            </Label>
            <AppSelect
              id="admin-interviewer-search-field"
              value={searchField}
              onChange={(v) => setSearchField(v as AdminInterviewerSearchField)}
              options={SEARCH_FIELD_OPTIONS}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="admin-interviewer-search" className="text-xs font-medium text-muted-foreground">
              Search
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-interviewer-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={SEARCH_PLACEHOLDERS[searchField]}
                className="h-11 bg-card !pl-10 pr-4"
              />
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="admin-interviewer-status-filter" className="text-xs font-medium text-muted-foreground">
              Status
            </Label>
            <AppSelect
              id="admin-interviewer-status-filter"
              value={statusTab}
              onChange={(v) => onStatusTabChange(v as AdminInterviewerStatusTab)}
              options={ADMIN_INTERVIEWER_STATUS_TABS.map((tab) => ({
                value: tab,
                label: `${TAB_LABELS[tab]} (${statusCounts[tab]})`,
              }))}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Showing {filtered.length} of {interviewers.length} interviewer
            {interviewers.length === 1 ? "" : "s"}
          </span>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                onStatusTabChange("all");
                setSearch("");
                setSearchField("name");
              }}
              className="font-medium text-[#7367F0] hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {interviewers.length === 0 ? (
        <EmptyState
          title="No peer interviewers yet"
          description="Applications will appear here when candidates apply to become interviewers."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No interviewers match your filters"
          description="Try a different status or search term, or clear filters to see everyone."
        />
      ) : (
        <div className={cn(appTableShell, "border-0 shadow-none")}>
          <TableShell headers={["Interviewer", "Role & company", "Experience", "Rating", "Status", "Actions"]}>
            {filtered.map((p) => (
              <tr
                key={p._id}
                className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-5 py-3.5 align-top">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7367F0]/10 text-sm font-semibold text-[#7367F0]">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.workEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 align-top">
                  <p className="text-sm font-medium text-foreground">{p.jobRole}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.company}</p>
                </td>
                <td className="px-5 py-3.5 align-top">
                  <p className="text-sm tabular-nums text-foreground">{p.yearsOfExperience}+ yrs</p>
                  {p.industry ? (
                    <p className="truncate text-xs text-muted-foreground">{p.industry}</p>
                  ) : null}
                </td>
                <td className="px-5 py-3.5 align-top">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {p.ratingCount > 0 ? p.ratingAvg.toFixed(1) : "New"}
                  </span>
                  {p.ratingCount > 0 ? (
                    <p className="text-xs text-muted-foreground">{p.ratingCount} reviews</p>
                  ) : null}
                </td>
                <td className="px-5 py-3.5 align-top">
                  <InterviewerStatusBadge status={p.status} />
                </td>
                <td className="px-5 py-3.5 align-top">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onView(p._id)}
                      className={cn(instituteSecondaryClass, "h-8 gap-1 px-3 text-xs")}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {p.status === "pending" ? "Review Details" : "View Details"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </TableShell>
        </div>
      )}
    </>
  );
}
