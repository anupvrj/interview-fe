import Script from "next/script";

interface StructuredDataProps {
  data: object;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Organization Schema
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Interview Trix",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://interviewtrix.com",
  logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://interviewtrix.com"}/logo.png`,
  description:
    "From ATS-optimized resumes to live AI mock interviews and detailed performance reports — everything you need to get shortlisted and hired.",
  sameAs: [
    // Add your social media links here
    "https://twitter.com/interviewtrix",
    "https://linkedin.com/company/interviewtrix",
  ],
};

// WebApplication Schema
export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Interview Trix - AI Resume Builder & Mock Interview Platform",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://interviewtrix.com",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  description:
    "From ATS-optimized resumes to live AI mock interviews and detailed performance reports — everything you need to get shortlisted and hired.",
  featureList: [
    "AI Resume Builder",
    "ATS Compatibility Checker",
    "Live AI Mock Interviews",
    "Detailed Performance Reports",
    "Multiple Professional Templates",
    "Job Search & Recommendations",
    "Real-time Resume Preview",
    "PDF Export",
  ],
};

// BreadcrumbList Schema
export function createBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// FAQ Schema
export function createFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
