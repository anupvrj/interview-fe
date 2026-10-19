import type { Metadata } from "next";
import { hackathonHand } from "@/lib/fonts/hackathon-hand";
import { getPrivateAppRobots } from "@/lib/seo/site-url";
import { DashboardClientLayout } from "./DashboardClientLayout";
import { DASHBOARD_THEME_BOOT_SCRIPT } from "@/components/dashboard-theme";

export const metadata: Metadata = {
  robots: getPrivateAppRobots(),
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={hackathonHand.variable}>
      {/* Applies the saved dark theme before paint (no light flash after visiting the hackathon). */}
      <script dangerouslySetInnerHTML={{ __html: DASHBOARD_THEME_BOOT_SCRIPT }} />
      <DashboardClientLayout>{children}</DashboardClientLayout>
    </div>
  );
}
