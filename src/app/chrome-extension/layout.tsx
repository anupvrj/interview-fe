import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Chrome Extension – Tailor Your Resume From Any Job | InterviewTrix",
  description:
    "Add the InterviewTrix Chrome extension to capture a job description from LinkedIn, Naukri, Indeed, and other boards, then create a tailored resume copy while staying signed in.",
  alternates: {
    canonical: `${siteUrl}/chrome-extension`,
  },
};

export default function ChromeExtensionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
