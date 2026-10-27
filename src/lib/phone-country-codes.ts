export type PhoneCountryCodeOption = {
  value: string;
  label: string;
};

/** Common dial codes for recruiter talent contact — longest codes first for parsing. */
export const PHONE_COUNTRY_CODES: PhoneCountryCodeOption[] = [
  { value: "+971", label: "+971" },
  { value: "+966", label: "+966" },
  { value: "+880", label: "+880" },
  { value: "+94", label: "+94" },
  { value: "+91", label: "+91" },
  { value: "+61", label: "+61" },
  { value: "+44", label: "+44" },
  { value: "+1", label: "+1" },
  { value: "+65", label: "+65" },
  { value: "+49", label: "+49" },
];

export const DEFAULT_PHONE_COUNTRY_CODE = "+91";
