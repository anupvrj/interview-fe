import {
  DEFAULT_PHONE_COUNTRY_CODE,
  PHONE_COUNTRY_CODES,
} from "@/lib/phone-country-codes";

export function parseStoredPhone(phone?: string | null): {
  countryCode: string;
  localNumber: string;
} {
  const raw = phone?.trim() ?? "";
  if (!raw) {
    return { countryCode: DEFAULT_PHONE_COUNTRY_CODE, localNumber: "" };
  }

  const sorted = [...PHONE_COUNTRY_CODES].sort(
    (a, b) => b.value.length - a.value.length,
  );
  for (const option of sorted) {
    if (raw.startsWith(option.value)) {
      return {
        countryCode: option.value,
        localNumber: raw.slice(option.value.length).replace(/[^\d]/g, ""),
      };
    }
  }

  if (raw.startsWith("+")) {
    const digits = raw.replace(/[^\d]/g, "");
    return {
      countryCode: DEFAULT_PHONE_COUNTRY_CODE,
      localNumber: digits,
    };
  }

  return {
    countryCode: DEFAULT_PHONE_COUNTRY_CODE,
    localNumber: raw.replace(/[^\d]/g, ""),
  };
}

export function formatPhoneForStorage(
  countryCode: string,
  localNumber: string,
): string {
  const digits = localNumber.replace(/[^\d]/g, "");
  if (!digits) return "";
  return `${countryCode} ${digits}`;
}

export function isValidPhoneForStorage(
  countryCode: string,
  localNumber: string,
): boolean {
  const digits = localNumber.replace(/[^\d]/g, "");
  if (!digits || digits.length < 6 || digits.length > 15) return false;
  return PHONE_COUNTRY_CODES.some((option) => option.value === countryCode);
}
