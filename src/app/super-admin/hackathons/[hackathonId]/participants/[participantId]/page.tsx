"use client";

import { useParams } from "next/navigation";
import { AdminSubmissionDetailPage } from "@/features/hackathon/admin/AdminSubmissionDetailPage";

export default function SuperAdminHackathonSubmissionRoute() {
  const params = useParams();
  return (
    <AdminSubmissionDetailPage
      hackathonId={String(params.hackathonId ?? "")}
      participantId={String(params.participantId ?? "")}
    />
  );
}
