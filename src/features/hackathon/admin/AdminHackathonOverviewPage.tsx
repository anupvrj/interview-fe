"use client";

import { useQuery } from "@tanstack/react-query";
import { hackathonAdminApi } from "../api";
import { hackathonKeys } from "../hooks";
import { AdminHackathonOperations } from "./AdminHackathonOperations";
import { HackathonAdminShell } from "./HackathonAdminShell";

export function AdminHackathonOverviewPage({ hackathonId }: Readonly<{ hackathonId: string }>) {
  const hackathon = useQuery({
    queryKey: hackathonKeys.adminOne(hackathonId),
    queryFn: () => hackathonAdminApi.get(hackathonId),
  });

  return (
    <HackathonAdminShell hackathonId={hackathonId} activeTab="overview">
      {hackathon.data ? <AdminHackathonOperations hackathon={hackathon.data} variant="plain" /> : null}
    </HackathonAdminShell>
  );
}
