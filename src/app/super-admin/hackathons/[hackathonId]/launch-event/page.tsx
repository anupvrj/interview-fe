"use client";

import { useParams } from "next/navigation";
import { AdminLaunchRegistrationsPage } from "@/features/hackathon/admin/AdminLaunchRegistrationsPage";

export default function SuperAdminHackathonLaunchEventRoute() {
  const params = useParams();
  return <AdminLaunchRegistrationsPage hackathonId={String(params.hackathonId ?? "")} />;
}
