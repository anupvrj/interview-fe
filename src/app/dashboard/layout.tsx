"use client";

import { ClientCacheVersionMonitor } from "@/components/ClientCacheVersionMonitor";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardToaster } from "@/components/DashboardToaster";
import { DashboardThemeProvider } from "@/components/dashboard-theme";
import { ActiveRoleProvider } from "@/components/roles/ActiveRoleProvider";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <DashboardThemeProvider>
      <ActiveRoleProvider>
        <ClientCacheVersionMonitor />
        <DashboardLayout>{children}</DashboardLayout>
        <DashboardToaster />
      </ActiveRoleProvider>
    </DashboardThemeProvider>
  );
}
