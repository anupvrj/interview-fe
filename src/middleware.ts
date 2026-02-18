import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/api/webhooks(.*)",
  "/ai-resume-builder(.*)",
  "/ai-job-search(.*)",
  "/ai-job-search",
  "/ai-interview-coach(.*)",
  "/about-us(.*)",
  "/pricing(.*)",
  "/ats-checker(.*)",
  "/contact(.*)",
  "/refund(.*)",
  "/terms(.*)",
  "/robots.txt",
  "/sitemap.xml",
]);

export default clerkMiddleware(
  async (auth, request) => {
    // Protect private routes
    if (!isPublicRoute(request)) {
      await auth.protect();
    }

    return NextResponse.next();
  },
  {
    debug: false,
  },
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
