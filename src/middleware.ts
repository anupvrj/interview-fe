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
  "/ai-coding-practice(.*)",
  "/ai-system-design(.*)",
  "/about-us(.*)",
  "/pricing(.*)",
  "/ats-checker(.*)",
  "/contact(.*)",
  "/refund(.*)",
  "/terms(.*)",
  "/privacy(.*)",
  "/hire-ix-talent(.*)",
  "/become-peer-interviewer(.*)",
  "/robots.txt",
  "/sitemap.xml",
]);

export default clerkMiddleware(
  async (auth, request) => {
    // Clerk appends __clerk_handshake while syncing session cookies across domains /
    // instances. auth.protect() on that request runs before the session exists and can
    // throw in Edge → Vercel MIDDLEWARE_INVOCATION_FAILED. Let the handshake finish first.
    if (request.nextUrl.searchParams.has("__clerk_handshake")) {
      return NextResponse.next();
    }

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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|mjs|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm|mov|m4v|ogv|mp3|wav|m4a|pdf)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
