import type { Metadata } from "next";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://interviewtrix.com";
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

export function getSearchRobots(): Metadata["robots"] {
  return isSearchIndexable() ? INDEX_ROBOTS : NOINDEX_ROBOTS;
}
