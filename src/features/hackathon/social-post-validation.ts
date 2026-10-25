export type SocialPlatform = "linkedin" | "instagram";

/**
 * Social post links, as the apps actually hand them out. Format-only: both platforms
 * block automated fetches, so a post can't be confirmed server-side (admins open every
 * link in review). This is the detailed check; the server
 * (interview-core/src/modules/hackathon/services/socialValidator.ts) only checks for a safe
 * link on the right platform.
 *
 * LinkedIn — accepted:
 *   linkedin.com/posts/<slug>                      ("Copy link to post")
 *   linkedin.com/feed/update/urn:li:<kind>:<id>     (also %-encoded, and /embed/…)
 *   linkedin.com/pulse/<slug>                       (articles)
 *   lnkd.in/<code>                                  (app share sheet; stored as given)
 *   on www., m. or a country subdomain (in., uk., …)
 * Instagram — accepted:
 *   instagram.com/p|reel|reels|tv/<code>
 *   instagram.com/<username>/p|reel/<code>          (newer web links)
 *   instagram.com/share/[p|reel/]<token>            (app Share button; stored as given)
 *   instagr.am/p/<code>
 * Profiles, company pages, stories and highlights are rejected (they aren't posts), and
 * a link for the other platform gets a "wrong box" message.
 *
 * `normalized` identifies the post across the forms above (unique per hackathon, so one
 * post can't be submitted twice): LinkedIn by activity id when the link has one, Instagram
 * by media code.
 */

export interface NormalizedSocialUrl {
  url: string;
  normalized: string;
}

export type SocialUrlCheck =
  | ({ ok: true } & NormalizedSocialUrl)
  | { ok: false; message: string };

const MAX_URL_LENGTH = 500;
const LABEL: Record<SocialPlatform, string> = { linkedin: "LinkedIn", instagram: "Instagram" };

const LINKEDIN_HOST = /^(?:www\.|m\.|[a-z]{2}\.)?linkedin\.com$/;
const LINKEDIN_SHORT_HOST = /^(?:www\.)?lnkd\.in$/;
const INSTAGRAM_HOST = /^(?:www\.|m\.)?instagram\.com$/;
const INSTAGRAM_SHORT_HOST = /^(?:www\.)?instagr\.am$/;

const LI_URN = /^urn:li:(activity|share|ugcPost):(\d{6,})$/;
/** activity / share / ugcPost id inside a /posts/ slug, e.g. "…-activity-7123…-AbCd". */
const LI_SLUG_ID = /(?:^|[-_])(activity|share|ugcPost)-(\d{6,})(?:-|$)/;
const IG_CODE = /^[A-Za-z0-9_-]{5,64}$/;
const IG_USERNAME = /^[A-Za-z0-9._]{1,30}$/;
const IG_MEDIA_KINDS = new Set(["p", "reel", "reels", "tv"]);
const IG_NOT_POSTS = new Set(["stories", "highlights", "explore", "accounts", "direct", "about", "legal"]);
const LI_NOT_POSTS = new Set(["in", "company", "school", "jobs", "groups", "learning", "events", "newsletters", "showcase"]);

const POST_HINT = "Open your post, tap ⋯ (or Share) → Copy link, and paste it here.";

function fail(message: string): SocialUrlCheck {
  return { ok: false, message };
}

/** Parses leniently (no scheme, http://, spaces), then checks host and path strictly. */
export function checkSocialPostUrl(platform: SocialPlatform, raw: string): SocialUrlCheck {
  const label = LABEL[platform];
  const generic = `Paste the link to your ${label} post. ${POST_HINT}`;

  let text = (raw ?? "").trim();
  if (!text) return fail(`Paste the link to your ${label} post.`);
  if (text.length > MAX_URL_LENGTH || /\s/.test(text)) return fail(generic);
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) text = `https://${text}`;

  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    return fail(generic);
  }
  if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || parsed.port) return fail(generic);

  const host = parsed.hostname.toLowerCase();
  let segments: string[];
  try {
    segments = parsed.pathname.split("/").filter(Boolean).map((s) => decodeURIComponent(s));
  } catch {
    return fail(generic);
  }

  const isLinkedIn = LINKEDIN_HOST.test(host) || LINKEDIN_SHORT_HOST.test(host);
  const isInstagram = INSTAGRAM_HOST.test(host) || INSTAGRAM_SHORT_HOST.test(host);
  if (platform === "linkedin" && isInstagram) return fail("That's an Instagram link — paste it in the Instagram box, and your LinkedIn post link here.");
  if (platform === "instagram" && isLinkedIn) return fail("That's a LinkedIn link — paste it in the LinkedIn box, and your Instagram post link here.");
  if (platform === "linkedin" && !isLinkedIn) return fail(`That isn't a LinkedIn link. ${POST_HINT}`);
  if (platform === "instagram" && !isInstagram) return fail(`That isn't an Instagram link. ${POST_HINT}`);

  return platform === "linkedin" ? checkLinkedIn(host, segments, parsed.pathname, generic) : checkInstagram(host, segments, generic);
}

function checkLinkedIn(host: string, segments: string[], rawPath: string, generic: string): SocialUrlCheck {
  if (LINKEDIN_SHORT_HOST.test(host)) {
    const code = segments[0];
    if (segments.length !== 1 || !/^[A-Za-z0-9_-]{4,32}$/.test(code)) return fail(generic);
    const url = `https://lnkd.in/${code}`;
    return { ok: true, url, normalized: url };
  }

  const [first, second, third, fourth] = segments;
  // /feed/update/urn:li:… and /embed/feed/update/urn:li:…
  const urn = first === "feed" && second === "update" ? third : first === "embed" && second === "feed" && third === "update" ? fourth : undefined;
  const urnLength = first === "embed" ? 4 : 3;
  if (urn !== undefined) {
    const m = LI_URN.exec(urn);
    if (!m || segments.length !== urnLength) return fail(generic);
    const url = `https://www.linkedin.com/feed/update/urn:li:${m[1]}:${m[2]}`;
    return { ok: true, url, normalized: `https://www.linkedin.com/feed/update/urn:li:activity:${m[2]}` };
  }

  if ((first === "posts" || first === "pulse") && segments.length === 2 && second.length >= 3) {
    // Keep the slug as it appears (encoded), so non-ASCII titles round-trip.
    const encodedSlug = rawPath.split("/").filter(Boolean)[1];
    const url = `https://www.linkedin.com/${first}/${encodedSlug}`;
    const id = first === "posts" ? LI_SLUG_ID.exec(second) : null;
    return { ok: true, url, normalized: id ? `https://www.linkedin.com/feed/update/urn:li:activity:${id[2]}` : url };
  }

  if (first && LI_NOT_POSTS.has(first)) {
    return fail("That's a link to a profile or page, not your post. Open the post itself, tap ⋯ (or Share) → Copy link, and paste it here.");
  }
  return fail(generic);
}

function checkInstagram(host: string, segments: string[], generic: string): SocialUrlCheck {
  const [first, second, third] = segments;

  // App Share button: instagram.com/share/<token> or /share/p|reel/<token> — stored as given.
  if (INSTAGRAM_HOST.test(host) && first === "share") {
    const kind = segments.length === 3 && (second === "p" || second === "reel" || second === "reels") ? (second === "reels" ? "reel" : second) : null;
    const token = kind ? third : segments.length === 2 ? second : undefined;
    if (!token || !IG_CODE.test(token)) return fail(generic);
    const url = `https://www.instagram.com/share/${kind ? `${kind}/` : ""}${token}`;
    return { ok: true, url, normalized: url };
  }

  // /p/<code>, /reel/<code>, … and /<username>/p/<code>, /<username>/reel/<code>
  let kind: string | undefined;
  let code: string | undefined;
  if (segments.length === 2 && IG_MEDIA_KINDS.has(first)) {
    [kind, code] = [first, second];
  } else if (segments.length === 3 && IG_USERNAME.test(first) && IG_MEDIA_KINDS.has(second) && !IG_NOT_POSTS.has(first)) {
    [kind, code] = [second, third];
  }
  if (kind && code && IG_CODE.test(code)) {
    const path = kind === "reels" ? "reel" : kind;
    // Codes are case-sensitive; a post and a reel with the same code are the same media.
    return { ok: true, url: `https://www.instagram.com/${path}/${code}`, normalized: `https://www.instagram.com/p/${code}` };
  }

  if (first && (IG_NOT_POSTS.has(first) || segments.length === 1)) {
    return fail(
      first === "stories" || first === "highlights"
        ? "That's a story, not a post — stories disappear after a day. Share a post or reel, then copy its link."
        : "That's a link to a profile, not your post. Open the post itself, tap ⋯ (or Share) → Copy link, and paste it here.",
    );
  }
  return fail(generic);
}

export class SocialPostUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SocialPostUrlError";
  }
}

/** The cleaned-up post link; throws SocialPostUrlError with a message the participant can act on. */
export function validateHackathonSocialPostUrl(platform: SocialPlatform, raw: string): string {
  const result = checkSocialPostUrl(platform, raw);
  if (!result.ok) throw new SocialPostUrlError(result.message);
  return result.url;
}
