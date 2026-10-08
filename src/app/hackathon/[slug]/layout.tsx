import type { Metadata, Viewport } from "next";
import { getSearchRobots } from "@/lib/seo/site-url";

/** Match the browser UI / overscroll area to the hackathon's navy canvas. */
export const viewport: Viewport = {
  themeColor: "#040b17",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Hackathon — InterviewTrix",
  robots: getSearchRobots(),
};

export default function HackathonSlugLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
