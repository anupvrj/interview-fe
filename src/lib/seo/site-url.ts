import type { Metadata } from "next";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://interviewtrix.com";
}

/** Resolve a public asset path (or absolute URL) to a crawlable absolute URL. */
export function getAbsoluteAssetUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const siteUrl = getSiteUrl().replace(/\/$/, "");
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** True only on production — staging/dev/local must not be indexed by search engines. */
export function isSearchIndexable(): boolean {
  const env = (
    process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.NODE_ENV ||
    "development"
  ).toLowerCase();

  if (env === "production" || env === "prod") return true;
  if (["staging", "stage", "development", "dev", "local", "test"].includes(env)) {
    return false;
  }

  const url = getSiteUrl().toLowerCase();
  if (!url || url.includes("localhost") || url.includes("127.0.0.1")) {
    return false;
  }
  if (
    /(^|\.)stage\.|staging\.|preview\.|vercel\.app|fly\.dev|onrender\.com/.test(
      url,
    )
  ) {
    return false;
  }

  return url.includes("interviewtrix.com");
}

const INDEX_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};

const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};

/** Authenticated app surfaces — always noindex even on production. */
export function getPrivateAppRobots(): Metadata["robots"] {
  return NOINDEX_ROBOTS;
}

export function getSearchRobots(): Metadata["robots"] {
  return isSearchIndexable() ? INDEX_ROBOTS : NOINDEX_ROBOTS;
}

export function isPrivateAppPath(pathname: string): boolean {
  return (
    pathname === "/*" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/select-role") ||
    pathname.startsWith("/purchase-credits") ||
    pathname.startsWith("/interview/")
  );
}
