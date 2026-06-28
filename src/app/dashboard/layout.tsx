import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardThemeProvider } from "@/components/dashboard-theme";
import { ActiveRoleProvider } from "@/components/roles/ActiveRoleProvider";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <DashboardThemeProvider>
      <ActiveRoleProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </ActiveRoleProvider>
    </DashboardThemeProvider>
  );
}
