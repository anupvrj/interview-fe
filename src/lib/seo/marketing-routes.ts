import type { MetadataRoute } from "next";

export type MarketingRoute = {
  path: string;
  name: string;
  description: string;
  sitemap: {
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
    priority: number;
  };
};

/** Public product landing pages — keep in sync with footer nav and JSON-LD. */
export const PRODUCT_MARKETING_ROUTES: MarketingRoute[] = [
  {
    path: "/ai-resume-builder",
    name: "AI Resume Builder",
    description:
      "Build ATS-optimized resumes with AI templates, live scoring, and PDF export.",
    sitemap: { changeFrequency: "weekly", priority: 0.9 },
  },
  {
    path: "/ats-checker",
    name: "ATS Resume Checker",
    description:
      "Score your resume against job descriptions and fix ATS compatibility issues.",
    sitemap: { changeFrequency: "weekly", priority: 0.85 },
  },
  {
    path: "/ai-interview-coach",
    name: "AI Mock Interview Practice",
    description:
      "Free AI mock interviews online with voice practice, company-specific questions, and instant feedback reports.",
    sitemap: { changeFrequency: "weekly", priority: 0.9 },
  },
  {
    path: "/ai-coding-practice",
    name: "AI Coding Interview Practice",
    description:
      "Solve coding problems in a live IDE with hidden tests and AI cross-examination.",
    sitemap: { changeFrequency: "weekly", priority: 0.9 },
  },
  {
    path: "/ai-system-design",
    name: "AI System Design Interview Practice",
    description:
      "Whiteboard architecture on Excalidraw with live AI voice coaching and rubric scoring.",
    sitemap: { changeFrequency: "weekly", priority: 0.9 },
  },
  {
    path: "/ai-job-search",
    name: "AI Job Search",
    description:
      "Find role-matched jobs with AI recommendations and application-ready profiles.",
    sitemap: { changeFrequency: "weekly", priority: 0.9 },
  },
  {
    path: "/hire-ix-talent",
    name: "Hire iX Talent",
    description:
      "Recruiters use iX scores and interview evidence to shortlist verified candidates.",
    sitemap: { changeFrequency: "weekly", priority: 0.85 },
  },
  {
    path: "/become-peer-interviewer",
    name: "Become a Peer Interviewer",
    description:
      "Monetize your interview experience by hosting paid peer mock interview sessions.",
    sitemap: { changeFrequency: "weekly", priority: 0.85 },
  },
];

export const SUPPORT_MARKETING_ROUTES: MarketingRoute[] = [
  {
    path: "/pricing",
    name: "Pricing",
    description: "Interview Trix plans, trials, and subscription pricing.",
    sitemap: { changeFrequency: "weekly", priority: 0.8 },
  },
  {
    path: "/about-us",
    name: "About Interview Trix",
    description: "Learn about the Interview Trix mission and team.",
    sitemap: { changeFrequency: "monthly", priority: 0.6 },
  },
  {
    path: "/contact",
    name: "Contact",
    description: "Contact Interview Trix for support, sales, and partnerships.",
    sitemap: { changeFrequency: "monthly", priority: 0.6 },
  },
  {
    path: "/privacy",
    name: "Privacy Policy",
    description: "How Interview Trix collects, uses, and protects your data.",
    sitemap: { changeFrequency: "monthly", priority: 0.5 },
  },
  {
    path: "/terms",
    name: "Terms of Service",
    description: "Terms and conditions for using Interview Trix.",
    sitemap: { changeFrequency: "monthly", priority: 0.5 },
  },
  {
    path: "/refund",
    name: "Refund Policy",
    description: "Refund and cancellation policy for Interview Trix subscriptions.",
    sitemap: { changeFrequency: "monthly", priority: 0.5 },
  },
];

export const ALL_MARKETING_ROUTES: MarketingRoute[] = [
  ...PRODUCT_MARKETING_ROUTES,
  ...SUPPORT_MARKETING_ROUTES,
];

export function marketingRouteToSitemapEntry(
  route: MarketingRoute,
  baseUrl: string,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.sitemap.changeFrequency,
    priority: route.sitemap.priority,
  };
}
