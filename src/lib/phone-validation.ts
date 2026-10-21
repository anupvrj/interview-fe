import { parsePhoneNumberFromString } from "libphonenumber-js/mobile";

/**
 * Mobile number checks for sign-up/profile forms.
 *
 * libphonenumber-js ("mobile" metadata) decides whether the number is a real mobile
 * number for its country — for India: 10 digits in a live mobile range starting 6–9.
 * On top of that we reject typed-in placeholders a real range can still contain
 * (9999999999, 9876543210, 9898989898, 9000000000…).
 */

const INDIA = "+91";

/** Digits only, without the country code or a trunk "0" someone typed or pasted. */
export function normaliseLocalNumber(countryCode: string, input: string): string {
  const digits = input.replace(/\D/g, "");
  if (countryCode === INDIA) {
    // "+91 98765 01234" or "098765 01234", pasted or typed a key at a time: hold the
    // prefix until the whole number is in, then drop it.
    if (digits.startsWith("91") && digits.length > 10) {
      return digits.length >= 12 ? digits.slice(2, 12) : digits;
    }
    if (digits.startsWith("0") && digits.length > 10) return digits.slice(1, 11);
    return digits.slice(0, 10);
  }
  return digits.slice(0, 15);
}

/** Numbers people type to get past a form: one digit repeated, runs, two-digit patterns. */
export function looksLikePlaceholderNumber(digits: string): boolean {
  if (digits.length < 6) return false;
  if (new Set(digits).size <= 2) return true; // 9999999999, 9898989898, 9000000000
  if (/(\d)\1{6,}/.test(digits)) return true; // seven or more of the same digit in a row
  const up = "01234567890123456789";
  const down = "98765432109876543210";
  for (let i = 0; i + 7 <= digits.length; i++) {
    const run = digits.slice(i, i + 7);
    if (up.includes(run) || down.includes(run)) return true; // 1234567…, 9876543…
  }
  return false;
}

export type PhoneCheck = { ok: true; e164: string } | { ok: false; message: string };

export function checkMobileNumber(countryCode: string, localNumber: string): PhoneCheck {
  const digits = normaliseLocalNumber(countryCode, localNumber);
  if (!digits) return { ok: false, message: "Enter your mobile number." };

  if (countryCode === INDIA) {
    if (digits.length < 10) return { ok: false, message: "Enter all 10 digits of your mobile number." };
    if (!/^[6-9]/.test(digits)) return { ok: false, message: "Indian mobile numbers start with 6, 7, 8 or 9." };
  }
  if (looksLikePlaceholderNumber(digits)) {
    return { ok: false, message: "That looks like a placeholder — enter your real mobile number." };
  }
  const parsed = parsePhoneNumberFromString(`${countryCode}${digits}`);
  if (!parsed || !parsed.isValid()) {
    return {
      ok: false,
      message: countryCode === INDIA ? "This isn't a valid Indian mobile number." : "This isn't a valid mobile number for the selected country.",
    };
  }
  return { ok: true, e164: parsed.number };
}

/** Digits a complete local number has (10 for India). */
export function maxLocalDigits(countryCode: string): number {
  return countryCode === INDIA ? 10 : 15;
}
