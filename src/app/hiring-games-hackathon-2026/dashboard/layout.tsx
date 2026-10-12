import type { Metadata } from "next";
import { getPrivateAppRobots } from "@/lib/seo/site-url";

export const metadata: Metadata = {
  title: "Your Hackathon Dashboard — InterviewTrix",
  robots: getPrivateAppRobots(),
  alternates: { canonical: null },
};

export default function HackathonDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
