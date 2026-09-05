import type { Metadata } from "next";
import { SeoVideoJsonLdScript } from "@/components/seo/SeoVideoJsonLdScript";
import {
  getMarketingVideoOpenGraphImage,
  peerInterviewBookingDemoVideo,
  toVideoSchemaInput,
} from "@/lib/seo/marketing-video-content";
import { getSiteUrl } from "@/lib/seo/site-url";

const siteUrl = getSiteUrl();

const pageTitle =
  "Become a Peer Interviewer | Earn from Live Mock Interviews";
const description =
  "Apply to become a verified peer interviewer on InterviewTrix. Set your pricing, publish flexible slots, run DSA and system design mocks, and earn from completed sessions.";

export const metadata: Metadata = {
  title: pageTitle,
  description,
  keywords:
    "peer interviewer, mock interview, earn interviewing, technical interviewer, DSA mock interview, system design mock, interview mentoring, InterviewTrix interviewer",
  alternates: {
    canonical: `${siteUrl}/become-peer-interviewer`,
  },
  openGraph: {
    title: `${pageTitle} | Interview Trix`,
    description,
    type: "website",
    url: `${siteUrl}/become-peer-interviewer`,
    images: [getMarketingVideoOpenGraphImage(peerInterviewBookingDemoVideo)],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | Interview Trix`,
    description:
      "Turn your interview experience into paid mock sessions. Set your schedule, pricing, and help candidates practice on InterviewTrix.",
  },
};

export default function BecomePeerInterviewerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SeoVideoJsonLdScript
        {...toVideoSchemaInput(peerInterviewBookingDemoVideo)}
      />
      {children}
    </>
  );
}
