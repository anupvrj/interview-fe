import type { Metadata, Viewport } from "next";
import { Caveat } from "next/font/google";
import {
  StructuredData,
  createBreadcrumbSchema,
  createFAQSchema,
} from "@/components/StructuredData";
import {
  HACKATHON_2026_META,
  HACKATHON_2026_PATH,
  HACKATHON_EVENT,
  HACKATHON_FAQ,
} from "@/lib/hackathon-2026-content";
import { getSiteUrl } from "@/lib/seo/site-url";

const handwriting = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-hackathon-hand",
  display: "swap",
});

const siteUrl = getSiteUrl();
const pageUrl = `${siteUrl}${HACKATHON_2026_PATH}`;

/** Match the browser UI / overscroll area to the hackathon's navy canvas. */
export const viewport: Viewport = {
  themeColor: "#040b17",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: HACKATHON_2026_META.title,
  description: HACKATHON_2026_META.description,
  keywords: HACKATHON_2026_META.keywords.join(", "),
  openGraph: {
    title: HACKATHON_2026_META.title,
    description: HACKATHON_2026_META.description,
    type: "website",
    url: pageUrl,
    images: [
      {
        url: `${siteUrl}/hackathon-2026/hero-candidate-desk.webp`,
        alt: "InterviewTrix Hackathon 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HACKATHON_2026_META.title,
    description: HACKATHON_2026_META.description,
  },
  alternates: {
    canonical: pageUrl,
  },
};

const breadcrumbSchema = createBreadcrumbSchema([
  { name: "Home", url: siteUrl },
  { name: "Hackathon 2026", url: pageUrl },
]);

const faqSchema = createFAQSchema(
  HACKATHON_FAQ.map((item) => ({ question: item.question, answer: item.answer })),
);

const eventSchema = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "InterviewTrix Hackathon & Product Launch — Navigating Careers in 2027",
  description: HACKATHON_2026_META.description,
  startDate: HACKATHON_EVENT.startISO,
  endDate: HACKATHON_EVENT.endISO,
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  location: {
    "@type": "VirtualLocation",
    url: pageUrl,
  },
  organizer: {
    "@type": "Organization",
    name: "Interview Trix",
    url: siteUrl,
  },
  isAccessibleForFree: true,
  image: `${siteUrl}/hackathon-2026/hero-candidate-desk.webp`,
  url: pageUrl,
};

export default function Hackathon2026Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData id="hackathon-2026-breadcrumb" data={breadcrumbSchema} />
      <StructuredData id="hackathon-2026-faq" data={faqSchema} />
      <StructuredData id="hackathon-2026-event" data={eventSchema} />
      <div className={handwriting.variable}>{children}</div>
    </>
  );
}
