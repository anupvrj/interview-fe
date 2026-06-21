import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free ATS Resume Checker | InterviewTrix",
  description:
    "Upload your resume for an instant Smart ATS Score across 27 checks — content, parse rate, HR red flags, seniority fit, and job tailoring.",
};

export default function ATSCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
