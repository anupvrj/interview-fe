import type { Metadata } from "next";
import { getPrivateAppRobots } from "@/lib/seo/site-url";

export const metadata: Metadata = {
  title: "Complete Your Hackathon Profile — InterviewTrix",
  robots: getPrivateAppRobots(),
  alternates: { canonical: null },
};

export default function HackathonProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
