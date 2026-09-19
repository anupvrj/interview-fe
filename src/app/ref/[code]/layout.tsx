import type { Metadata } from "next";
import { getPrivateAppRobots } from "@/lib/seo/site-url";

export const metadata: Metadata = {
  robots: getPrivateAppRobots(),
  title: "Referral",
};

export default function ReferralLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
