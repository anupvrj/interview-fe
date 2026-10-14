"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { appPrimaryButton } from "@/lib/app-theme";
import { hackathonAdminApi, toHackathonError, type HackathonPhase } from "../api";
import { HACKATHON_ADMIN_PATH } from "../config";
import { hackathonKeys } from "../hooks";
import { HackathonManageCard } from "./AdminHackathonOperations";
import { phaseStatusLabel } from "./hackathonAdminStatus";
import { Badge } from "@/components/ui/badge";

const adminKeys = { list: hackathonKeys.adminList };

export { phaseStatusLabel } from "./hackathonAdminStatus";

export function phaseBadge(phase: HackathonPhase) {
  const label = phaseStatusLabel(phase);
  if (phase === "live") return <Badge variant="success">{label}</Badge>;
  if (phase === "ended") return <Badge variant="neutral">{label}</Badge>;
  return <Badge variant="warning">{label}</Badge>;
}

export function AdminHackathonsPage() {
  const list = useQuery({ queryKey: adminKeys.list, queryFn: hackathonAdminApi.list });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SuperAdminPageHeader />
        <Button asChild className={appPrimaryButton}>
          <Link href={`${HACKATHON_ADMIN_PATH}/new`}>
            <Plus className="mr-1.5 h-4 w-4" /> Create hackathon
          </Link>
        </Button>
      </div>
      {list.isLoading ? (
        <div className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading hackathons…
        </div>
      ) : list.isError ? (
        <Card>
          <CardContent className="py-8 text-sm text-destructive">
            {toHackathonError(list.error, "Couldn't load hackathons. Check that the Hackathon feature is enabled in Feature Controls.").message}
          </CardContent>
        </Card>
      ) : (list.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-8 text-sm text-muted-foreground">
            <p>No hackathons yet. Create one to get a public page and participant dashboard.</p>
            <Button asChild className={appPrimaryButton}>
              <Link href={`${HACKATHON_ADMIN_PATH}/new`}>
                <Plus className="mr-1.5 h-4 w-4" /> Create hackathon
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        list.data!.map((h) => <HackathonManageCard key={h.hackathonId} hackathon={h} />)
      )}
    </div>
  );
}
