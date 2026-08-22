import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Interview Trix Blog — Interview Prep, AI Careers & Hiring Tips",
  description:
    "Expert guides on AI interview preparation, resume optimization, coding practice, system design, and career growth. Learn from Interview Trix.",
  keywords: [
    "interview preparation blog",
    "AI interview tips",
    "resume optimization",
    "coding interview guide",
    "system design interview",
    "career advice India",
  ].join(", "),
  openGraph: {
    title: "Interview Trix Blog",
    description:
      "Expert guides on AI interview preparation, resume optimization, and career growth.",
    type: "website",
    url: `${siteUrl}/blogs`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Interview Trix Blog",
    description:
      "Expert guides on AI interview preparation, resume optimization, and career growth.",
  },
  alternates: {
    canonical: `${siteUrl}/blogs`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
