export type PhoneCountryCodeOption = {
  value: string;
  label: string;
};

/** Common dial codes for recruiter talent contact — longest codes first for parsing. */
export const PHONE_COUNTRY_CODES: PhoneCountryCodeOption[] = [
  { value: "+971", label: "UAE (+971)" },
  { value: "+966", label: "Saudi Arabia (+966)" },
  { value: "+880", label: "Bangladesh (+880)" },
  { value: "+94", label: "Sri Lanka (+94)" },
  { value: "+91", label: "India (+91)" },
  { value: "+61", label: "Australia (+61)" },
  { value: "+44", label: "UK (+44)" },
  { value: "+1", label: "US / Canada (+1)" },
  { value: "+65", label: "Singapore (+65)" },
  { value: "+49", label: "Germany (+49)" },
];

export const DEFAULT_PHONE_COUNTRY_CODE = "+91";
