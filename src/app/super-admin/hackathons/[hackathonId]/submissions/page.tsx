"use client";

import { useParams } from "next/navigation";
import { AdminSubmissionsPage } from "@/features/hackathon/admin/AdminSubmissionsPage";

export default function SuperAdminHackathonSubmissionsRoute() {
  const params = useParams();
  return <AdminSubmissionsPage hackathonId={String(params.hackathonId ?? "")} />;
}
