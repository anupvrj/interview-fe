import type { Metadata } from "next";
import { getPrivateAppRobots } from "@/lib/seo/site-url";
import { SuperAdminClientLayout } from "./SuperAdminClientLayout";

export const metadata: Metadata = {
  robots: getPrivateAppRobots(),
};

export default function SuperAdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SuperAdminClientLayout>{children}</SuperAdminClientLayout>;
}
