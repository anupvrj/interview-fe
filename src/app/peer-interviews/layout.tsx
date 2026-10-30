import type { Metadata } from "next";
import { FeatureRouteGuard } from "@/components/features/FeatureRouteGuard";
import { defaultOgImage } from "@/lib/seo/default-og-image";
import { getSiteUrl } from "@/lib/seo/site-url";

const siteUrl = getSiteUrl();

// Placeholder copy from the redesign prototype; final SEO title/description to come.
const pageTitle = "Peer Mock Interviews with Verified Engineers";
const description =
  "Book a live mock interview with a verified engineer. Filter by round, industry and experience, pick a slot, and pay only after they accept.";

export const metadata: Metadata = {
  title: pageTitle,
  description,
  alternates: { canonical: `${siteUrl}/peer-interviews` },
  openGraph: {
    title: `${pageTitle} | Interview Trix`,
    description,
    type: "website",
    url: `${siteUrl}/peer-interviews`,
    images: [defaultOgImage],
  },
  twitter: { card: "summary_large_image", title: `${pageTitle} | Interview Trix`, description },
};

export default function PeerInterviewsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <FeatureRouteGuard>{children}</FeatureRouteGuard>;
}
