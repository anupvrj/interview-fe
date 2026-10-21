import { describe, expect, it } from "vitest";
import { checkMobileNumber, looksLikePlaceholderNumber, normaliseLocalNumber } from "../phone-validation";
import { isValidPhoneForStorage } from "../phone-utils";

const ok = (cc: string, n: string) => checkMobileNumber(cc, n).ok;
const msg = (cc: string, n: string) => {
  const r = checkMobileNumber(cc, n);
  return r.ok ? null : r.message;
};

describe("Indian mobile numbers", () => {
  it("accepts real-looking numbers in live mobile ranges", () => {
    for (const n of ["9876501234", "8130457962", "7019283746", "6362047915"]) expect(ok("+91", n)).toBe(true);
  });

  it("needs exactly 10 digits starting 6–9", () => {
    expect(msg("+91", "98765")).toMatch(/10 digits/);
    expect(msg("+91", "5876501234")).toMatch(/start with 6, 7, 8 or 9/);
    expect(msg("+91", "1234554321")).toMatch(/start with 6, 7, 8 or 9/);
  });

  it("rejects placeholders even inside a valid range", () => {
    for (const n of ["9999999999", "9876543210", "9898989898", "9000000000", "9123456789", "8888888881"]) {
      expect(msg("+91", n)).toMatch(/placeholder/);
    }
  });

  it("rejects zeros and junk", () => {
    expect(ok("+91", "0000000000")).toBe(false);
    expect(ok("+91", "1234455455")).toBe(false);
  });

  it("strips +91 / 0 that people paste", () => {
    expect(normaliseLocalNumber("+91", "+91 98765 01234")).toBe("9876501234");
    expect(normaliseLocalNumber("+91", "098765-01234")).toBe("9876501234");
    expect(normaliseLocalNumber("+91", "98765012345678")).toBe("9876501234");
  });

  it("handles +91 typed one key at a time", () => {
    let value = "";
    for (const ch of "+91 98765 01234") value = normaliseLocalNumber("+91", value + ch);
    expect(value).toBe("9876501234");
    let withZero = "";
    for (const ch of "098765 01234") withZero = normaliseLocalNumber("+91", withZero + ch);
    expect(withZero).toBe("9876501234");
  });

  it("is what the forms use before saving", () => {
    expect(isValidPhoneForStorage("+91", "9876501234")).toBe(true);
    expect(isValidPhoneForStorage("+91", "1234567890")).toBe(false);
  });
});

describe("other countries", () => {
  it("validates by the selected country", () => {
    expect(ok("+44", "7911123456")).toBe(true); // UK mobile range
    expect(ok("+44", "7700900123")).toBe(false); // reserved for TV/fiction
    expect(ok("+44", "2079460123")).toBe(false); // London landline, not a mobile
    expect(ok("+1", "4155550199")).toBe(true);
  });
});

describe("looksLikePlaceholderNumber", () => {
  it("leaves ordinary numbers alone", () => {
    expect(looksLikePlaceholderNumber("9876501234")).toBe(false);
    expect(looksLikePlaceholderNumber("8130457962")).toBe(false);
  });
});
