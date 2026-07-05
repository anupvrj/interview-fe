import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hire iX Talent — Verified Interview-Ready Candidates",
  description:
    "Recruit on InterviewTrix with verified iX Scores, full interview reports, and rich filters. Apply to become a recruiter and shortlist interview-ready talent.",
  keywords:
    "hire developers, recruiter platform, verified candidates, iX Score, interview reports, technical hiring, talent marketplace",
  alternates: {
    canonical: "https://interviewtrix.com/hire-ix-talent",
  },
  openGraph: {
    title: "Hire iX Talent — Verified Interview-Ready Candidates | Interview Trix",
    description:
      "Access candidates with verified iX Scores, full interview reports, and hiring pipeline tools.",
    type: "website",
    url: "https://interviewtrix.com/hire-ix-talent",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hire iX Talent — Verified Interview-Ready Candidates | Interview Trix",
    description:
      "Access candidates with verified iX Scores, full interview reports, and hiring pipeline tools.",
  },
};

export default function HireIxTalentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
