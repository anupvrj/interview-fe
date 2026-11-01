import type { Metadata } from "next";
import { getPrivateAppRobots } from "@/lib/seo/site-url";
import { DASHBOARD_THEME_BOOT_SCRIPT } from "@/components/dashboard-theme";
import { SuperAdminClientLayout } from "./SuperAdminClientLayout";

export const metadata: Metadata = {
  robots: getPrivateAppRobots(),
};

export default function SuperAdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DASHBOARD_THEME_BOOT_SCRIPT }} />
      <SuperAdminClientLayout>{children}</SuperAdminClientLayout>
    </>
  );
}
