"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { cn } from "@/lib/utils";
import { hackathonAdminApi, toHackathonError } from "../api";
import { HACKATHON_ADMIN_PATH } from "../config";
import { hackathonKeys } from "../hooks";
import { phaseBadge } from "./AdminHackathonsPage";
import { HACKATHON_ADMIN_TABS, hackathonAdminTabHref, type HackathonAdminTab } from "./hackathonAdminNav";

export function HackathonAdminShell({
  hackathonId,
  activeTab,
  children,
  hideNav,
  headerExtra,
  unsavedChanges,
}: Readonly<{
  hackathonId: string;
  activeTab: HackathonAdminTab;
  children: React.ReactNode;
  hideNav?: boolean;
  headerExtra?: React.ReactNode;
  /** When true, leaving via tab nav prompts before discarding edits. */
  unsavedChanges?: boolean;
}>) {
  const hackathon = useQuery({
    queryKey: hackathonKeys.adminOne(hackathonId),
    queryFn: () => hackathonAdminApi.get(hackathonId),
  });

  return (
    <div className="space-y-5">
      <SuperAdminPageHeader
        backHref={HACKATHON_ADMIN_PATH}
        backLabel="Hackathons"
        unsavedChanges={unsavedChanges}
        title={hackathon.data?.title ?? "Hackathon"}
        actions={
          hackathon.data || headerExtra ? (
            <div className="flex flex-wrap items-center gap-2">
              {headerExtra}
              {hackathon.data ? phaseBadge(hackathon.data.phase) : null}
            </div>
          ) : undefined
        }
      />

      {!hideNav ? (
        <nav className="flex flex-wrap gap-2 border-b border-border/60 pb-3" aria-label="Hackathon sections">
          {HACKATHON_ADMIN_TABS.map(({ tab, label }) => {
            const href = hackathonAdminTabHref(hackathonId, tab);
            const active = tab === activeTab;
            return (
              <Link
                key={tab}
                href={href}
                onClick={(event) => {
                  if (!unsavedChanges || active) return;
                  if (!window.confirm("You have unsaved changes. Leave this page anyway?")) {
                    event.preventDefault();
                  }
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {hackathon.isLoading && !hackathon.data ? (
        <div className="flex items-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : hackathon.isError ? (
        <p className="text-sm text-destructive">{toHackathonError(hackathon.error).message}</p>
      ) : (
        children
      )}
    </div>
  );
}
