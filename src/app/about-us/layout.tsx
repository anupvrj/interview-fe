import type { Metadata } from "next";
import {
  StructuredData,
  createBreadcrumbSchema,
  createFAQSchema,
} from "@/components/StructuredData";
import { ABOUT_US_FAQ } from "@/lib/aboutUsContent";
import { getSiteUrl } from "@/lib/seo/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "About Interview Trix — Redefining AI Interview Preparation",
  description:
    "Learn how Interview Trix is changing interview prep for the AI hiring era. One platform for ATS resumes, AI mock interviews, coding practice, and peer sessions—built for candidates in India and beyond.",
  keywords: [
    "about Interview Trix",
    "interview preparation platform",
    "AI interview practice",
    "ATS resume builder",
    "career platform India",
    "mock interview AI",
    "peer mock interviews",
    "interview prep company",
  ].join(", "),
  openGraph: {
    title: "About Interview Trix — Redefining Interview Preparation",
    description:
      "Discover how Interview Trix unifies resume building, AI interviews, coding practice, and peer sessions into one prep loop built for modern hiring.",
    type: "website",
    url: `${siteUrl}/about-us`,
  },
  twitter: {
    card: "summary_large_image",
    title: "About Interview Trix — Redefining Interview Preparation",
    description:
      "One platform for the full prep journey—from ATS-ready resumes to AI mock interviews and peer validation.",
  },
  alternates: {
    canonical: `${siteUrl}/about-us`,
  },
};

const breadcrumbSchema = createBreadcrumbSchema([
  { name: "Home", url: siteUrl },
  { name: "About Us", url: `${siteUrl}/about-us` },
]);

const faqSchema = createFAQSchema([...ABOUT_US_FAQ]);

export default function AboutUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={faqSchema} />
      {children}
    </>
  );
}
