const REF_COOKIE = "itx_ref";
const VID_COOKIE = "itx_vid";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const CODE_PATTERN = /^[A-Z0-9]{8}$/;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1)) || null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
}

export function normalizeReferralCode(code: string): string {
  return String(code || "")
    .trim()
    .toUpperCase();
}

export function isValidReferralCode(code: string): boolean {
  return CODE_PATTERN.test(normalizeReferralCode(code));
}

export function getOrCreateVisitorId(): string {
  const existing = readCookie(VID_COOKIE);
  if (existing && existing.length >= 8) return existing;
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const visitorId = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  writeCookie(VID_COOKIE, visitorId);
  return visitorId;
}

export function getStoredReferralCode(): string | null {
  const code = normalizeReferralCode(readCookie(REF_COOKIE) || "");
  return isValidReferralCode(code) ? code : null;
}

export function storeReferralCode(code: string): string | null {
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCode(normalized)) return getStoredReferralCode();
  const existing = getStoredReferralCode();
  if (existing) return existing;
  writeCookie(REF_COOKIE, normalized);
  getOrCreateVisitorId();
  return normalized;
}

export function rememberReferralCode(code: string): {
  code: string | null;
  visitorId: string;
} {
  const visitorId = getOrCreateVisitorId();
  return { code: storeReferralCode(code), visitorId };
}
