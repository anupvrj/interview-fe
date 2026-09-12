"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { SuperAdminUsersTable } from "@/components/super-admin/SuperAdminUsersTable";

function UsersPageBody() {
  return (
    <div className="space-y-6">
      <SuperAdminPageHeader />
      <SuperAdminUsersTable />
    </div>
  );
}

export default function SuperAdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <UsersPageBody />
    </Suspense>
  );
}
