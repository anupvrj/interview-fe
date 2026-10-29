import type { Metadata, Viewport } from "next";
import { hackathonHand } from "@/lib/fonts/hackathon-hand";
import { hackathonDisplay, hackathonMono, hackathonSans } from "@/lib/fonts/hackathon-reel";
import { EVENT_REGISTRATION_PATH } from "@/features/hackathon/config";
import { LAUNCH_EVENT_META } from "@/lib/hackathon-2026-content";
import { getSiteUrl } from "@/lib/seo/site-url";
import { StuckLoadingWatchdog } from "@/components/StuckLoadingWatchdog";

const siteUrl = getSiteUrl();
const pageUrl = `${siteUrl}${EVENT_REGISTRATION_PATH}`;

export const viewport: Viewport = {
  themeColor: "#040b17",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: LAUNCH_EVENT_META.title,
  description: LAUNCH_EVENT_META.description,
  // og:image / twitter:image from ./opengraph-image.tsx (1200×630 PNG).
  openGraph: {
    title: LAUNCH_EVENT_META.title,
    description: LAUNCH_EVENT_META.description,
    type: "website",
    url: pageUrl,
    siteName: "InterviewTrix",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: LAUNCH_EVENT_META.title,
    description: LAUNCH_EVENT_META.description,
  },
  alternates: {
    canonical: pageUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ProductLaunchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${hackathonHand.variable} ${hackathonDisplay.variable} ${hackathonSans.variable} ${hackathonMono.variable}`}
    >
      {children}
      <StuckLoadingWatchdog />
    </div>
  );
}
