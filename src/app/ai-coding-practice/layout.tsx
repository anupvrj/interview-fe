import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "AI Coding Interview Practice — Live IDE Mock Round",
  description:
    "Practice coding interviews in a live IDE with public and hidden test cases, complexity follow-ups, and AI cross-examination—just like a real technical round.",
  keywords:
    "AI coding interview, coding round practice, live coding IDE, technical interview prep, LeetCode style mock interview, hidden test cases, algorithm interview practice, software engineer coding interview",
  alternates: {
    canonical: `${siteUrl}/ai-coding-practice`,
  },
  openGraph: {
    title:
      "AI Coding Interview Practice — Live IDE Mock Round | Interview Trix",
    description:
      "Run code against hidden tests, explain your approach, and defend time and space complexity with an AI interviewer.",
    type: "website",
    url: `${siteUrl}/ai-coding-practice`,
  },
  twitter: {
    card: "summary_large_image",
    title:
      "AI Coding Interview Practice — Live IDE Mock Round | Interview Trix",
    description:
      "Run code against hidden tests, explain your approach, and defend time and space complexity with an AI interviewer.",
  },
};

export default function AiCodingPracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
