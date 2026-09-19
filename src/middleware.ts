import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getCanonicalHostname,
  isInterviewTrixHostname,
  isPrivateAppPath,
  isSearchIndexable,
} from "@/lib/seo/site-url";

const NOINDEX_HEADER = "noindex, nofollow, noarchive, nosnippet";

function withSearchHeaders(
  response: NextResponse,
  pathname: string,
): NextResponse {
  if (!isSearchIndexable() || isPrivateAppPath(pathname)) {
    response.headers.set("X-Robots-Tag", NOINDEX_HEADER);
  }
  return response;
}

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/api/webhooks(.*)",
  "/api/revalidate",
  "/ai-resume-builder(.*)",
  "/chrome-extension(.*)",
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
  "/ref(.*)",
  "/hire-ix-talent(.*)",
  "/become-peer-interviewer(.*)",
  "/blogs(.*)",
  "/robots.txt",
  "/sitemap.xml",
]);

function canonicalHostRedirect(request: Request): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;

  const requestHost = new URL(request.url).hostname.toLowerCase();
  if (!isInterviewTrixHostname(requestHost)) return null;

  const canonicalHost = getCanonicalHostname();
  if (requestHost === canonicalHost) return null;

  const url = new URL(request.url);
  url.hostname = canonicalHost;
  return NextResponse.redirect(url, 308);
}

export default clerkMiddleware(
  async (auth, request) => {
    const hostRedirect = canonicalHostRedirect(request);
    if (hostRedirect) {
      return hostRedirect;
    }

    const pathname = request.nextUrl.pathname;

    if (pathname === "/*") {
      return withSearchHeaders(new NextResponse("Not Found", { status: 404 }), pathname);
    }

    // Clerk appends __clerk_handshake while syncing session cookies across domains /
    // instances. auth.protect() on that request runs before the session exists and can
    // throw in Edge → Vercel MIDDLEWARE_INVOCATION_FAILED. Let the handshake finish first.
    if (request.nextUrl.searchParams.has("__clerk_handshake")) {
      return withSearchHeaders(NextResponse.next(), pathname);
    }

    // Protect private routes — preserve the intended destination for post-login redirect
    if (!isPublicRoute(request)) {
      const { userId } = await auth();
      if (!userId) {
        const signInUrl = new URL("/sign-in", request.url);
        const returnPath = `${pathname}${request.nextUrl.search}`;
        signInUrl.searchParams.set("redirect_url", returnPath);
        return withSearchHeaders(
          NextResponse.redirect(signInUrl),
          pathname,
        );
      }
    }

    return withSearchHeaders(NextResponse.next(), pathname);
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
