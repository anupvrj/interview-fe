"use client";

import { ClientCacheVersionMonitor } from "@/components/ClientCacheVersionMonitor";
import { SuperAdminLayout } from "@/components/super-admin/SuperAdminLayout";
import { DashboardToaster } from "@/components/DashboardToaster";
import { DashboardThemeProvider } from "@/components/dashboard-theme";
import { ActiveRoleProvider } from "@/components/roles/ActiveRoleProvider";

export function SuperAdminClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <DashboardThemeProvider>
      <ActiveRoleProvider>
        <ClientCacheVersionMonitor />
        <SuperAdminLayout>{children}</SuperAdminLayout>
        <DashboardToaster />
      </ActiveRoleProvider>
    </DashboardThemeProvider>
  );
}
