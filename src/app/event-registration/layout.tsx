import type { Metadata, Viewport } from "next";
import { hackathonHand } from "@/lib/fonts/hackathon-hand";
import { hackathonDisplay, hackathonMono, hackathonSans } from "@/lib/fonts/hackathon-reel";
import { EVENT_REGISTRATION_PATH } from "@/features/hackathon/config";
import { HACKATHON_LAUNCH, LAUNCH_EVENT_FORM } from "@/lib/hackathon-2026-content";
import { getSiteUrl } from "@/lib/seo/site-url";
import { StuckLoadingWatchdog } from "@/components/StuckLoadingWatchdog";

const siteUrl = getSiteUrl();
const pageUrl = `${siteUrl}${EVENT_REGISTRATION_PATH}`;

export const viewport: Viewport = {
  themeColor: "#040b17",
  colorScheme: "dark",
};

const title = `${LAUNCH_EVENT_FORM.title} · InterviewTrix Live Event`;
const description = `${LAUNCH_EVENT_FORM.teaserBody} ${HACKATHON_LAUNCH.dateLabel}, ${HACKATHON_LAUNCH.timeLabel}. Free registration.`;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: pageUrl,
    siteName: "InterviewTrix",
    locale: "en_IN",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  alternates: {
    canonical: pageUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EventRegistrationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${hackathonHand.variable} ${hackathonDisplay.variable} ${hackathonSans.variable} ${hackathonMono.variable}`}
    >
      {children}
      <StuckLoadingWatchdog />
    </div>
  );
}
