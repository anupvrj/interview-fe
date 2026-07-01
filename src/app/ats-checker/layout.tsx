import type { Metadata } from "next";
import { atsCheckerDemoVideo } from "@/lib/seo/marketing-video-content";
import { getSiteUrl } from "@/lib/seo/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Free ATS Resume Checker | Interview Trix",
  description:
    "Upload your resume for an instant Smart ATS Score across 27 checks — content, parse rate, HR red flags, seniority fit, and job tailoring.",
  keywords:
    "ATS resume checker, ATS score, resume scanner, applicant tracking system, resume optimization, free ATS check",
  openGraph: {
    title: "Free ATS Resume Checker | Interview Trix",
    description:
      "Upload your resume for an instant Smart ATS Score across 27 checks — content, parse rate, HR red flags, and job tailoring.",
    type: "website",
    url: `${siteUrl}/ats-checker`,
    videos: [
      {
        url: atsCheckerDemoVideo.videoUrl,
        width: 1280,
        height: 720,
        type: "video/mp4",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free ATS Resume Checker | Interview Trix",
    description:
      "Instant Smart ATS Score across 27 checks — fix issues before you apply.",
  },
  alternates: {
    canonical: `${siteUrl}/ats-checker`,
  },
};

export default function ATSCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
