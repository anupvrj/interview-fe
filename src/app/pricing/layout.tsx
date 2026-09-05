import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Pricing Plans - Career-Targeted Subscriptions | InterviewTrix",
  description:
    "General Pass for non-tech professionals, Tech Basic for developers, Tech Pro for senior engineers. Monthly subscriptions from ₹599 with AI interviews, coding, system design, resume & ATS.",
  keywords:
    "pricing, plans, subscription, career tools pricing, interview preparation cost, resume builder pricing",
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    title: "Pricing Plans - Choose Your Perfect Plan | Interview Trix",
    description:
      "Flexible pricing plans for every career stage. Start free or choose a plan that fits your needs.",
    type: "website",
    url: `${siteUrl}/pricing`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing Plans - Choose Your Perfect Plan | Interview Trix",
    description:
      "Flexible pricing plans for every career stage. Start free or choose a plan that fits your needs.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
