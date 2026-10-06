"use client";

import { useParams } from "next/navigation";
import { AdminHackathonDesignerPage } from "@/features/hackathon/admin/AdminHackathonDesignerPage";

export default function SuperAdminHackathonEditRoute() {
  const params = useParams();
  return <AdminHackathonDesignerPage hackathonId={String(params.hackathonId ?? "")} />;
}
