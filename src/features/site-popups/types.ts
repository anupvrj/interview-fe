/**
 * Site popups — shared types. Keep in sync with interview-core
 * `src/modules/popups/constants.ts` and `models/SitePopup.ts`.
 */
export const POPUP_DESIGNS = ["spotlight", "split", "banner", "sheet", "corner", "minimal"] as const;
export type PopupDesign = (typeof POPUP_DESIGNS)[number];

export type PopupCtaAction = "link" | "hackathon_register";
export type PopupCountdownMode = "none" | "custom" | "hackathon_start" | "hackathon_end" | "hackathon_auto";
export type PopupAudience = "all" | "signed_in" | "signed_out";
export type PopupDevice = "all" | "desktop" | "mobile";

export type PopupCta = {
  label: string;
  action: PopupCtaAction;
  url: string;
  newTab: boolean;
};

export type SitePopupContent = {
  eyebrow: string;
  title: string;
  titleAccent: string;
  body: string;
  priceOriginal: string;
  priceNow: string;
  prizeLabel: string;
  prizeValue: string;
  countdownLabel: string;
  imageUrl: string;
  imageAlt: string;
  footnote: string;
};

/** What every visitor receives from GET /config/popups. */
export type PublicSitePopup = {
  _id: string;
  priority: number;
  design: PopupDesign;
  content: SitePopupContent;
  show: { price: boolean; prize: boolean; countdown: boolean };
  countdown: { mode: PopupCountdownMode; target: string | null };
  primaryCta: PopupCta;
  secondaryCta: PopupCta & { enabled: boolean };
  targeting: {
    pages: string[];
    excludePages: string[];
    audience: PopupAudience;
    devices: PopupDevice;
    hackathonSlug: string;
    hideIfRegistered: boolean;
  };
  trigger: { delaySeconds: number; scrollPercent: number; exitIntent: boolean };
  frequency: { dismissCooldownHours: number; clickCooldownHours: number };
  schedule: { startsAt: string | null; endsAt: string | null };
  updatedAt?: string;
};

/** Full admin record. */
export type SitePopup = PublicSitePopup & {
  key?: string;
  name: string;
  enabled: boolean;
  updatedBy?: string;
  createdAt?: string;
};

export type SitePopupInput = Omit<SitePopup, "_id" | "key" | "updatedAt" | "createdAt" | "updatedBy">;

/** Paths popups never render on, whatever the admin picks. */
export const POPUP_BLOCKED_PATH_PREFIXES = ["/super-admin", "/sign-in", "/sign-up", "/sso-callback"];
