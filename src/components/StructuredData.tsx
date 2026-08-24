import Script from "next/script";

interface StructuredDataProps {
  data: object;
  id?: string;
}

export function StructuredData({ data, id = "structured-data" }: StructuredDataProps) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organization `sameAs` for JSON-LD — keep in sync with `SocialLinks.tsx` hrefs */
export const ORGANIZATION_SAME_AS = [
  "https://www.instagram.com/interviewtrix_official/",
  "https://x.com/InterviewTrix",
  "https://www.youtube.com/@interviewtrix_official",
  "https://www.linkedin.com/company/interview-trix/",
] as const;

// Organization Schema
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Interview Trix",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://interviewtrix.com",
  logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://interviewtrix.com"}/brand/interviewtrix-logo.png`,
  description:
    "From ATS-optimized resumes to AI Interview Practice and detailed performance reports — everything you need to get shortlisted and hired.",
  sameAs: [...ORGANIZATION_SAME_AS],
};

// WebApplication Schema
export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Interview Trix - AI Resume Builder & AI Interview Practice",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://interviewtrix.com",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  description:
    "From ATS-optimized resumes to AI Interview Practice and detailed performance reports — everything you need to get shortlisted and hired.",
  featureList: [
    "AI Resume Builder",
    "ATS Compatibility Checker",
    "AI Interview Practice",
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

export function createBlogPostingSchema(post: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  keywords?: string[];
}) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://interviewtrix.com";
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    ...(post.image ? { image: post.image } : {}),
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    author: {
      "@type": "Person",
      name: post.authorName,
    },
    publisher: {
      ...organizationSchema,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/brand/interviewtrix-logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": post.url,
    },
    ...(post.keywords?.length
      ? { keywords: post.keywords.join(", ") }
      : {}),
  };
}
