import type { Metadata, Viewport } from "next";
import { getSearchRobots } from "@/lib/seo/site-url";
import { hackathonHand } from "@/lib/fonts/hackathon-hand";
import { hackathonDisplay, hackathonMono, hackathonSans } from "@/lib/fonts/hackathon-reel";
import { StuckLoadingWatchdog } from "@/components/StuckLoadingWatchdog";

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
  return (
    <div
      className={`${hackathonHand.variable} ${hackathonDisplay.variable} ${hackathonSans.variable} ${hackathonMono.variable}`}
    >
      {children}
      {/* "Something isn't right" if anything here loads for over 60 s. */}
      <StuckLoadingWatchdog />
    </div>
  );
}
