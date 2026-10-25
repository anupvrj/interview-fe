/**
 * Only checks that a link was given — no platform or post-format rules (admins review the
 * posts). It must be a web link (http/https; "https://" is added if missing). Same rule as
 * interview-core/src/modules/hackathon/services/socialValidator.ts.
 */

export type SocialPlatform = "linkedin" | "instagram";

const MAX_URL_LENGTH = 500;

export class SocialPostUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SocialPostUrlError";
  }
}

/** The link to submit; throws SocialPostUrlError when the field is empty or not a link. */
export function validateHackathonSocialPostUrl(platform: SocialPlatform, raw: string): string {
  const label = platform === "linkedin" ? "LinkedIn" : "Instagram";
  const invalid = () => new SocialPostUrlError(`Paste the link to your ${label} post.`);

  let text = (raw ?? "").trim();
  if (!text || text.length > MAX_URL_LENGTH) throw invalid();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(text)) text = `https://${text}`;

  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    throw invalid();
  }
  if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname) throw invalid();
  return parsed.href;
}
