import { getSiteUrl } from "@/lib/seo/site-url";
import { HACKATHON_SOCIALS } from "@/lib/hackathon-2026-content";

/**
 * Platform notes:
 * - LinkedIn cannot crawl localhost for link previews. Always share the public production event URL.
 * - share-offsite only attaches a URL; use feed shareActive for prefilled post text (paste fallback via clipboard).
 * - Instagram: no web API to prefill post text; open create flow + clipboard.
 * - Follow: LinkedIn/Meta do not expose APIs for third-party sites to follow on the user’s
 *   behalf — the user must tap Follow on LinkedIn or Instagram (we open profile/company).
 */

/** Public event links shared on social (must be reachable by LinkedIn’s crawler). */
export const HACKATHON_PUBLIC_SHARE_ORIGIN = "https://interviewtrix.com";

/** Official InterviewTrix profiles (same as hackathon landing footer). */
export const INTERVIEWTRIX_LINKEDIN_COMPANY =
  HACKATHON_SOCIALS.find((s) => s.icon === "linkedin")?.href ?? "https://www.linkedin.com/company/interview-trix/";

export const INTERVIEWTRIX_INSTAGRAM_PROFILE =
  HACKATHON_SOCIALS.find((s) => s.icon === "instagram")?.href ?? "https://www.instagram.com/interviewtrix_official/";

/** Product page (reviews/upvote) — not the /p/… forum. */
export const INTERVIEWTRIX_PRODUCT_HUNT_URL = "https://www.producthunt.com/products/interview-trix";
export const INTERVIEWTRIX_CAPTERRA_URL = "https://www.capterra.com/search?query=InterviewTrix";

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, "");
}

function isLocalDevOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

/** URL candidates paste in posts — always production when testing from localhost. */
export function hackathonPublicShareUrl(landingPath: string, browserOrigin?: string): string {
  const path = landingPath.startsWith("/") ? landingPath : `/${landingPath}`;
  const origin = normalizeOrigin(
    browserOrigin ?? (typeof window !== "undefined" ? window.location.origin : getSiteUrl()),
  );
  const base = isLocalDevOrigin(origin) ? HACKATHON_PUBLIC_SHARE_ORIGIN : origin;
  return `${base}${path}`;
}

export function buildShareCaptionForClipboard(caption: string, pageUrl: string): string {
  return `${caption.trim()}\n\n${pageUrl.trim()}`;
}

/** Opens LinkedIn feed composer with post text (caption + public event link). */
export function buildLinkedInShareComposeUrl(caption: string, publicPageUrl: string): string {
  const text = buildShareCaptionForClipboard(caption, publicPageUrl);
  return buildLinkedInShareComposeUrlFromFullText(text);
}

/** Opens LinkedIn feed composer when the post body is already fully formatted. */
export function buildLinkedInShareComposeUrlFromFullText(fullText: string): string {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(fullText.trim())}`;
}

/** Copy caption and open LinkedIn feed composer (text only — attach images via Save image). */
export async function openLinkedInShareCompose(args: { fullText: string; composeUrl: string }): Promise<void> {
  try {
    await navigator.clipboard.writeText(args.fullText.trim());
  } catch {
    /* LinkedIn may still prefill via composeUrl */
  }
  window.open(args.composeUrl, "_blank", "noopener,noreferrer");
}

/** Link-only share; use when you need a preview card without prefilled text. */
export function buildLinkedInShareOffsiteUrl(pageUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl.trim())}`;
}

/**
 * Instagram has no web URL that pre-fills a post. We open the main site/app;
 * the user taps + → Post and pastes the caption we copied to the clipboard.
 * (/create/select/ only shows the media picker and confuses people on desktop.)
 */
export function instagramShareOpenUrl(): string {
  return "https://www.instagram.com/";
}

/** @deprecated Use instagramShareOpenUrl */
export function instagramShareEntryUrl(): string {
  return instagramShareOpenUrl();
}

/** Browser origin + path (e.g. for display on localhost). Prefer hackathonPublicShareUrl for social share. */
export function hackathonSharePageUrl(landingPath: string, origin?: string): string {
  const base = normalizeOrigin(
    origin ?? (typeof window !== "undefined" ? window.location.origin : getSiteUrl()),
  );
  const path = landingPath.startsWith("/") ? landingPath : `/${landingPath}`;
  return `${base}${path}`;
}

/** @deprecated Use buildLinkedInShareComposeUrl */
export function buildLinkedInShareUrl(caption: string, pageUrl: string): string {
  return buildLinkedInShareComposeUrl(caption, pageUrl);
}
