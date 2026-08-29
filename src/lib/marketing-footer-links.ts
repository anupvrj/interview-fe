export type FooterLink = {
  href: string;
  label: string;
};

export const FOOTER_IMPORTANT_LINKS: FooterLink[] = [
  { href: "/about-us", label: "About us" },
  { href: "/contact", label: "Contact" },
  { href: "/blogs", label: "Blogs" },
  { href: "/pricing", label: "Pricing" },
  {
    href: "/sign-in?redirect_url=/dashboard",
    label: "Dashboard Login",
  },
];

export const FOOTER_PRODUCT_LINKS: FooterLink[] = [
  { href: "/ai-resume-builder", label: "Resume Builder" },
  { href: "/chrome-extension", label: "Chrome Extension" },
  { href: "/ats-checker", label: "ATS Checker" },
  { href: "/ai-interview-coach", label: "AI Mock Interview" },
  { href: "/ai-coding-practice", label: "AI Coding Round Interview" },
  {
    href: "/ai-system-design",
    label: "AI Live System Design Interview",
  },
  { href: "/ai-job-search", label: "AI Job Search" },
  { href: "/become-peer-interviewer", label: "Become a Peer Interviewer" },
  { href: "/hire-ix-talent", label: "Hire iX Talent" },
];

export const FOOTER_POLICY_LINKS: FooterLink[] = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund", label: "Refund Policy" },
];
