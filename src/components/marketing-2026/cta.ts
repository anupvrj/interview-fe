export const MK26_ROUTES = {
  home: "/",
  interview: "/ai-interview-coach",
  resume: "/ai-resume-builder",
  coding: "/ai-coding-practice",
  systemDesign: "/ai-system-design",
  ats: "/ats-checker",
  pricing: "/pricing",
  about: "/about-us",
  blogs: "/blogs",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  chrome: "/chrome-extension",
  peer: "/become-peer-interviewer",
  signIn: "/sign-in",
  signUp: "/sign-up",
  startInterview: "/dashboard/interviews/new",
  startResume: "/dashboard/resumes/new",
  startCoding: "/dashboard/coding-interviews/new",
  startSystemDesign: "/dashboard/system-design",
} as const;

export function signUpTo(dest: string): string {
  return `${MK26_ROUTES.signUp}?redirect_url=${encodeURIComponent(dest)}`;
}
