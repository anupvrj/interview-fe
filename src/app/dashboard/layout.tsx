import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardThemeProvider } from "@/components/dashboard-theme";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <DashboardThemeProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardThemeProvider>
  );
}
