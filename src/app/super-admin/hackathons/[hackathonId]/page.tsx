"use client";

import { useParams } from "next/navigation";
import { AdminHackathonOverviewPage } from "@/features/hackathon/admin/AdminHackathonOverviewPage";

export default function SuperAdminHackathonOverviewRoute() {
  const params = useParams();
  return <AdminHackathonOverviewPage hackathonId={String(params.hackathonId ?? "")} />;
}
