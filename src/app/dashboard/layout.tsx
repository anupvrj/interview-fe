import type { Metadata } from "next";
import { getPrivateAppRobots } from "@/lib/seo/site-url";
import { DashboardClientLayout } from "./DashboardClientLayout";

export const metadata: Metadata = {
  robots: getPrivateAppRobots(),
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
