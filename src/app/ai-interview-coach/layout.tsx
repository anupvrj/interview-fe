import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "AI Mock Interview Practice — Free Voice Mock Interviews Online",
  description:
    "Practice free AI mock interviews online with realistic voice conversations, company-specific questions, and instant feedback. Get scored on technical, behavioral, and communication skills before your real interview.",
  keywords: [
    "AI mock interview",
    "mock interview practice",
    "free mock interview",
    "AI mock interview online",
    "voice mock interview",
    "mock interview with AI",
    "AI interview practice",
    "company-specific mock interview",
    "behavioral mock interview",
    "technical mock interview prep",
  ].join(", "),
  alternates: {
    canonical: `${siteUrl}/ai-interview-coach`,
  },
  openGraph: {
    title:
      "AI Mock Interview Practice — Free Voice Mock Interviews | Interview Trix",
    description:
      "Free AI mock interviews with realistic voice practice, company-specific questions, instant feedback, and detailed performance reports.",
    type: "website",
    url: `${siteUrl}/ai-interview-coach`,
  },
  twitter: {
    card: "summary_large_image",
    title:
      "AI Mock Interview Practice — Free Voice Mock Interviews | Interview Trix",
    description:
      "Free AI mock interviews with realistic voice practice, company-specific questions, instant feedback, and detailed performance reports.",
  },
};

export default function InterviewCoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
