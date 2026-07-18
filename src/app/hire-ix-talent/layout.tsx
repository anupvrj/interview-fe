import type { Metadata } from "next";
import { hireIxTalentDemoVideo } from "@/lib/seo/marketing-video-content";
import { getSiteUrl } from "@/lib/seo/site-url";

const siteUrl = getSiteUrl();

const pageTitle =
  "Hire iX Talent | Interview-Ready Candidates with Verified iX Scores";
const description =
  "Search verified iX Talent with AI interview reports, session video, and iX Scores. Filter by role, skills, and industry—then shortlist candidates with proof, not guesswork.";

export const metadata: Metadata = {
  title: pageTitle,
  description,
  keywords:
    "hire iX talent, recruiter platform, verified candidates, iX Score, AI interview reports, technical hiring, talent marketplace, interview-ready candidates, hiring pipeline",
  alternates: {
    canonical: `${siteUrl}/hire-ix-talent`,
  },
  openGraph: {
    title: `${pageTitle} | Interview Trix`,
    description,
    type: "website",
    url: `${siteUrl}/hire-ix-talent`,
    videos: [
      {
        url: hireIxTalentDemoVideo.videoUrl,
        width: 1280,
        height: 720,
        type: "video/mp4",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | Interview Trix`,
    description:
      "Search verified iX Talent with iX Scores, AI interview reports, and session video—then shortlist with proof.",
  },
};

export default function HireIxTalentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
