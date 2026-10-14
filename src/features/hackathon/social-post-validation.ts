/**
 * Client-side mirror of interview-core socialValidator rules (keep in sync with
 * interview-core/src/modules/hackathon/services/socialValidator.ts).
 */

export type SocialPlatform = "linkedin" | "instagram";

const LINKEDIN_HOSTS = new Set(["linkedin.com", "www.linkedin.com", "in.linkedin.com", "m.linkedin.com"]);
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com"]);

const LINKEDIN_POST_PATTERNS = [
  /^\/posts\/[A-Za-z0-9_%.-]+\/?$/,
  /^\/feed\/update\/urn:li:(activity|share|ugcPost):\d{6,}\/?$/,
];
const INSTAGRAM_POST_PATTERN = /^\/(p|reel|reels|tv)\/[A-Za-z0-9_-]{5,}\/?$/;

const MAX_URL_LENGTH = 500;

export class SocialPostUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SocialPostUrlError";
  }
}

export function validateHackathonSocialPostUrl(platform: SocialPlatform, raw: string): string {
  const label = platform === "linkedin" ? "LinkedIn" : "Instagram";
  const invalid = () =>
    new SocialPostUrlError(
      `Paste the link to your ${label} post (it should start with https://${
        platform === "linkedin" ? "www.linkedin.com/posts/" : "www.instagram.com/p/"
      }).`,
    );

  const trimmed = (raw ?? "").trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) throw invalid();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw invalid();
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port) {
    throw invalid();
  }

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;
  try {
    decodeURIComponent(path);
  } catch {
    throw invalid();
  }

  if (platform === "linkedin") {
    if (!LINKEDIN_HOSTS.has(host)) throw invalid();
    if (!LINKEDIN_POST_PATTERNS.some((pattern) => pattern.test(path))) throw invalid();
  } else {
    if (!INSTAGRAM_HOSTS.has(host)) throw invalid();
    if (!INSTAGRAM_POST_PATTERN.test(path)) throw invalid();
  }

  const cleanPath = parsed.pathname.replace(/\/+$/, "");
  const canonicalHost = platform === "linkedin" ? "www.linkedin.com" : "www.instagram.com";
  const url = `https://${canonicalHost}${cleanPath}`;
  return platform === "instagram" ? url.replace(/\/reels\//, "/reel/") : url;
}
