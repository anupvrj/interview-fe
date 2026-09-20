export type PhoneType = "mobile" | "home" | "work";

export type ApplicationEducationEntry = {
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
};

export type ApplicationAddress = {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

export type ApplicationLinks = {
  linkedin: string;
  github: string;
  portfolio: string;
  website: string;
  twitter: string;
  behance: string;
  dribbble: string;
  other: string[];
};

export type ApplicationProfile = {
  firstName: string;
  middleName: string;
  lastName: string;
  legalName: string;
  preferredName: string;
  username: string;
  phoneType: PhoneType | "";
  birthday: string;
  address: ApplicationAddress;
  coverLetter: string;
  highestDegree: string;
  education: ApplicationEducationEntry[];
  currentlyWorking?: boolean;
  eeoAutofillEnabled: boolean;
  gender: string;
  ethnicity: string;
  hispanic: string;
  veteranStatus: string;
  armedForces: string;
  disability: string;
  lgbt: string;
  workAuthorization: string;
  workAuthorizationUs: string;
  sponsorship: string;
  links: ApplicationLinks;
  languages: string[];
  source: string;
  referredBy: string;
};

export const PHONE_TYPE_OPTIONS = [
  { value: "mobile", label: "Mobile" },
  { value: "home", label: "Home" },
  { value: "work", label: "Work" },
] as const;

export const HIGHEST_DEGREE_OPTIONS = [
  { value: "High School", label: "High School" },
  { value: "Associate", label: "Associate" },
  { value: "Bachelor's", label: "Bachelor's" },
  { value: "Master's", label: "Master's" },
  { value: "MBA", label: "MBA" },
  { value: "PhD", label: "PhD" },
  { value: "Other", label: "Other" },
] as const;

export const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Non-binary", label: "Non-binary" },
  { value: "Prefer not to say", label: "Prefer not to say" },
] as const;

export const ETHNICITY_OPTIONS = [
  { value: "American Indian or Alaska Native", label: "American Indian or Alaska Native" },
  { value: "Asian", label: "Asian" },
  { value: "Black or African American", label: "Black or African American" },
  { value: "Hispanic or Latino", label: "Hispanic or Latino" },
  { value: "Native Hawaiian or Other Pacific Islander", label: "Native Hawaiian or Other Pacific Islander" },
  { value: "White", label: "White" },
  { value: "Two or more races", label: "Two or more races" },
  { value: "Prefer not to say", label: "Prefer not to say" },
] as const;

export const YES_NO_PREFER_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "prefer_not", label: "Prefer not to say" },
] as const;

export const VETERAN_STATUS_OPTIONS = [
  { value: "I am not a protected veteran", label: "I am not a protected veteran" },
  { value: "I identify as a protected veteran", label: "I identify as a protected veteran" },
  { value: "I am a veteran", label: "I am a veteran" },
  { value: "Prefer not to say", label: "Prefer not to say" },
] as const;

export const WORK_AUTH_OPTIONS = [
  { value: "Authorized to work", label: "Authorized to work" },
  { value: "Not authorized", label: "Not authorized" },
] as const;

export const WORK_AUTH_US_OPTIONS = [
  { value: "Authorized to work in the US", label: "Authorized to work in the US" },
  { value: "Need sponsorship", label: "Need sponsorship" },
  { value: "Not authorized", label: "Not authorized" },
] as const;

export const SPONSORSHIP_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function emptyEducationEntry(): ApplicationEducationEntry {
  return { school: "", degree: "", field: "", startDate: "", endDate: "" };
}

export function emptyApplicationProfile(): ApplicationProfile {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    legalName: "",
    preferredName: "",
    username: "",
    phoneType: "",
    birthday: "",
    address: { street: "", city: "", state: "", country: "", postalCode: "" },
    coverLetter: "",
    highestDegree: "",
    education: [],
    currentlyWorking: undefined,
    eeoAutofillEnabled: false,
    gender: "",
    ethnicity: "",
    hispanic: "",
    veteranStatus: "",
    armedForces: "",
    disability: "",
    lgbt: "",
    workAuthorization: "",
    workAuthorizationUs: "",
    sponsorship: "",
    links: {
      linkedin: "",
      github: "",
      portfolio: "",
      website: "",
      twitter: "",
      behance: "",
      dribbble: "",
      other: [],
    },
    languages: [],
    source: "",
    referredBy: "",
  };
}

export function splitPersonName(name: string): {
  firstName: string;
  middleName: string;
  lastName: string;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", middleName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], middleName: "", lastName: "" };
  if (parts.length === 2) return { firstName: parts[0], middleName: "", lastName: parts[1] };
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

export function joinPersonName(
  firstName: string,
  middleName = "",
  lastName = "",
): string {
  return [firstName, middleName, lastName].map((part) => part.trim()).filter(Boolean).join(" ");
}

export function composeLocation(address: ApplicationAddress): string {
  return [address.city, address.state, address.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

export function isApplicationProfileEmpty(profile: ApplicationProfile): boolean {
  const links = profile.links;
  return !(
    profile.legalName ||
    profile.preferredName ||
    profile.username ||
    profile.birthday ||
    profile.address.street ||
    profile.address.city ||
    profile.address.country ||
    profile.coverLetter ||
    profile.highestDegree ||
    profile.education.length > 0 ||
    profile.gender ||
    profile.ethnicity ||
    profile.workAuthorization ||
    links.linkedin ||
    links.github ||
    links.portfolio ||
    links.website ||
    profile.languages.length > 0 ||
    profile.source ||
    profile.referredBy
  );
}

function parseAddress(raw: unknown): ApplicationAddress {
  const rec = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    street: asString(rec.street),
    city: asString(rec.city),
    state: asString(rec.state),
    country: asString(rec.country),
    postalCode: asString(rec.postalCode),
  };
}

function parseLinks(raw: unknown): ApplicationLinks {
  const rec = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    linkedin: asString(rec.linkedin),
    github: asString(rec.github),
    portfolio: asString(rec.portfolio),
    website: asString(rec.website),
    twitter: asString(rec.twitter),
    behance: asString(rec.behance),
    dribbble: asString(rec.dribbble),
    other: asStringList(rec.other),
  };
}

function parseEducation(raw: unknown): ApplicationEducationEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((rec) => ({
      school: asString(rec.school),
      degree: asString(rec.degree),
      field: asString(rec.field),
      startDate: asString(rec.startDate),
      endDate: asString(rec.endDate),
    }))
    .filter((entry) => entry.school || entry.degree || entry.field);
}

export function parseApplicationProfile(raw: unknown): ApplicationProfile {
  const base = emptyApplicationProfile();
  if (!raw || typeof raw !== "object") return base;
  const rec = raw as Record<string, unknown>;
  const phoneType = asString(rec.phoneType);
  const currentlyWorking =
    rec.currentlyWorking === true
      ? true
      : rec.currentlyWorking === false
        ? false
        : undefined;
  return {
    ...base,
    firstName: asString(rec.firstName),
    middleName: asString(rec.middleName),
    lastName: asString(rec.lastName),
    legalName: asString(rec.legalName),
    preferredName: asString(rec.preferredName),
    username: asString(rec.username),
    phoneType:
      phoneType === "mobile" || phoneType === "home" || phoneType === "work"
        ? phoneType
        : "",
    birthday: asString(rec.birthday),
    address: parseAddress(rec.address),
    coverLetter: asString(rec.coverLetter),
    highestDegree: asString(rec.highestDegree),
    education: parseEducation(rec.education),
    currentlyWorking,
    eeoAutofillEnabled: rec.eeoAutofillEnabled === true,
    gender: asString(rec.gender),
    ethnicity: asString(rec.ethnicity),
    hispanic: asString(rec.hispanic),
    veteranStatus: asString(rec.veteranStatus),
    armedForces: asString(rec.armedForces),
    disability: asString(rec.disability),
    lgbt: asString(rec.lgbt),
    workAuthorization: asString(rec.workAuthorization),
    workAuthorizationUs: asString(rec.workAuthorizationUs),
    sponsorship: asString(rec.sponsorship),
    links: parseLinks(rec.links),
    languages: asStringList(rec.languages),
    source: asString(rec.source),
    referredBy: asString(rec.referredBy),
  };
}

export function applicationProfileFromUser(user: {
  name?: string;
  applicationProfile?: ApplicationProfile | null;
}): ApplicationProfile {
  const parsed = parseApplicationProfile(user.applicationProfile);
  const split = splitPersonName(user.name || "");
  return {
    ...parsed,
    firstName: parsed.firstName || split.firstName,
    middleName: parsed.middleName || split.middleName,
    lastName: parsed.lastName || split.lastName,
  };
}

export function prefillApplicationProfileFromResume(
  profile: ApplicationProfile,
  personalInfo?: {
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    website?: string;
    x?: string;
    dateOfBirth?: string;
    gender?: string;
    disability?: string;
  } | null,
): ApplicationProfile {
  if (!personalInfo || !isApplicationProfileEmpty(profile)) return profile;
  const location = asString(personalInfo.location);
  const [city, state, country] = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    ...profile,
    birthday: profile.birthday || asString(personalInfo.dateOfBirth),
    gender: profile.gender || asString(personalInfo.gender),
    disability: profile.disability || asString(personalInfo.disability),
    address: {
      ...profile.address,
      city: profile.address.city || city || "",
      state: profile.address.state || state || "",
      country: profile.address.country || country || "",
    },
    links: {
      ...profile.links,
      linkedin: profile.links.linkedin || asString(personalInfo.linkedin),
      github: profile.links.github || asString(personalInfo.github),
      portfolio: profile.links.portfolio || asString(personalInfo.portfolio),
      website: profile.links.website || asString(personalInfo.website),
      twitter: profile.links.twitter || asString(personalInfo.x),
    },
  };
}

export function displayYesNoPrefer(value: string | undefined): string {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  if (value === "prefer_not") return "Prefer not to say";
  return value?.trim() || "—";
}
