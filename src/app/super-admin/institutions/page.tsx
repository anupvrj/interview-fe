"use client";

import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { SuperAdminInstitutionsManager } from "@/components/super-admin/SuperAdminInstitutionsManager";

export default function SuperAdminInstitutionsPage() {
  return (
    <div className="space-y-6">
      <SuperAdminPageHeader />
      <SuperAdminInstitutionsManager />
    </div>
  );
}
