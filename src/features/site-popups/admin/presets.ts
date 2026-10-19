import { HACKATHON_LANDING_PATH, HACKATHON_SLUG } from "@/features/hackathon/config";
import { isoToIstInput, istInputToIso } from "@/features/hackathon/admin/time";
import type { PopupDesign, SitePopup, SitePopupInput } from "../types";

export const DESIGN_OPTIONS: ReadonlyArray<{ value: PopupDesign; label: string; description: string; blocking: boolean }> = [
  { value: "spotlight", label: "Spotlight", description: "Centred popup with the grid floor, price, prize card and countdown. Best for the hackathon.", blocking: true },
  { value: "split", label: "Split showcase", description: "Wide popup: picture or prize poster on the left, message and buttons on the right.", blocking: true },
  { value: "banner", label: "Countdown bar", description: "Slim bar along the bottom of the page. Doesn't block the page.", blocking: false },
  { value: "sheet", label: "Bottom sheet", description: "Slides up from the bottom. Feels native on phones.", blocking: true },
  { value: "corner", label: "Corner card", description: "Small card in the bottom-right corner. Doesn't block the page.", blocking: false },
  { value: "minimal", label: "Minimal", description: "Clean centred card: title, message and one button.", blocking: true },
];

export const PAGE_PRESETS: ReadonlyArray<{ label: string; pattern: string; hint: string }> = [
  { label: "Home page", pattern: "/", hint: "/" },
  { label: "Hackathon page", pattern: HACKATHON_LANDING_PATH, hint: HACKATHON_LANDING_PATH },
  { label: "User dashboard", pattern: "/dashboard*", hint: "/dashboard and every page under it" },
  { label: "Hackathon challenge dashboards", pattern: "/hackathon/*/dashboard", hint: "/hackathon/<event>/dashboard" },
  { label: "Pricing", pattern: "/pricing*", hint: "/pricing" },
  { label: "Blog", pattern: "/blog*", hint: "/blog and every post" },
  { label: "Every page", pattern: "/*", hint: "Whole site (admin pages are always skipped)" },
];

export const CTA_ACTION_OPTIONS = [
  { value: "hackathon_register", label: "Start hackathon registration" },
  { value: "link", label: "Open a link" },
] as const;

export const COUNTDOWN_OPTIONS = [
  { value: "hackathon_auto", label: "Hackathon — start, then end once live" },
  { value: "hackathon_start", label: "Hackathon start" },
  { value: "hackathon_end", label: "Hackathon end" },
  { value: "custom", label: "A date I choose" },
  { value: "none", label: "No countdown" },
] as const;

export const AUDIENCE_OPTIONS = [
  { value: "all", label: "Everyone" },
  { value: "signed_out", label: "Only visitors who aren't signed in" },
  { value: "signed_in", label: "Only signed-in users" },
] as const;

export const DEVICE_OPTIONS = [
  { value: "all", label: "Desktop and mobile" },
  { value: "desktop", label: "Desktop only" },
  { value: "mobile", label: "Mobile only" },
] as const;

/** Editor state: dates kept as IST wall-clock strings (YYYY-MM-DDTHH:mm), pages as text. */
export type PopupForm = Omit<SitePopupInput, "schedule" | "countdown" | "targeting"> & {
  countdown: { mode: SitePopupInput["countdown"]["mode"]; target: string };
  schedule: { startsAt: string; endsAt: string };
  targeting: Omit<SitePopupInput["targeting"], "pages" | "excludePages"> & { pagesText: string; excludeText: string };
};

export function newPopupForm(): PopupForm {
  return {
    name: "",
    enabled: false,
    priority: 0,
    design: "spotlight",
    content: {
      eyebrow: "Live hackathon · The Hiring Games",
      title: "InterviewTrix:",
      titleAccent: "The Hiring Games",
      body: "Build an ATS-ready resume, face the AI interviewer and compete for the prize pool.",
      priceOriginal: "₹799",
      priceNow: "FREE",
      prizeLabel: "Total prize pool",
      prizeValue: "₹20,000",
      countdownLabel: "",
      imageUrl: "",
      imageAlt: "",
      footnote: "Limited seats. Registration takes under a minute.",
    },
    show: { price: true, prize: true, countdown: true },
    countdown: { mode: "hackathon_auto", target: "" },
    primaryCta: { label: "Register for free", action: "hackathon_register", url: "", newTab: false },
    secondaryCta: { enabled: true, label: "See how it works", action: "link", url: HACKATHON_LANDING_PATH, newTab: false },
    targeting: {
      pagesText: ["/", HACKATHON_LANDING_PATH, "/dashboard*"].join("\n"),
      excludeText: "",
      audience: "all",
      devices: "all",
      hackathonSlug: HACKATHON_SLUG,
      hideIfRegistered: true,
    },
    trigger: { delaySeconds: 10, scrollPercent: 40, exitIntent: true },
    frequency: { dismissCooldownHours: 24, clickCooldownHours: 168 },
    schedule: { startsAt: "", endsAt: "" },
  };
}

export function toForm(popup: SitePopup): PopupForm {
  return {
    name: popup.name,
    enabled: popup.enabled,
    priority: popup.priority ?? 0,
    design: popup.design,
    content: { ...newPopupForm().content, ...popup.content },
    show: { ...popup.show },
    countdown: { mode: popup.countdown?.mode ?? "none", target: isoToIstInput(popup.countdown?.target) },
    primaryCta: { ...popup.primaryCta },
    secondaryCta: { ...popup.secondaryCta },
    targeting: {
      pagesText: (popup.targeting?.pages ?? []).join("\n"),
      excludeText: (popup.targeting?.excludePages ?? []).join("\n"),
      audience: popup.targeting?.audience ?? "all",
      devices: popup.targeting?.devices ?? "all",
      hackathonSlug: popup.targeting?.hackathonSlug ?? "",
      hideIfRegistered: popup.targeting?.hideIfRegistered ?? true,
    },
    trigger: { ...popup.trigger },
    frequency: { ...popup.frequency },
    schedule: { startsAt: isoToIstInput(popup.schedule?.startsAt), endsAt: isoToIstInput(popup.schedule?.endsAt) },
  };
}

export function parsePageLines(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/[\n,]/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => (line.startsWith("/") ? line : `/${line}`)),
    ),
  );
}

/** Builds the API payload. Returns an error message instead when something is missing. */
export function toInput(form: PopupForm): { input: SitePopupInput } | { error: string } {
  const pages = parsePageLines(form.targeting.pagesText);
  if (!form.name.trim()) return { error: "Give the popup a name." };
  if (pages.length === 0) return { error: "Pick at least one page to show the popup on." };
  const countdownTarget = form.countdown.mode === "custom" ? istInputToIso(form.countdown.target) : null;
  if (form.countdown.mode === "custom" && form.show.countdown && !countdownTarget) {
    return { error: "Set the date and time the countdown runs to." };
  }
  const startsAt = form.schedule.startsAt ? istInputToIso(form.schedule.startsAt) : null;
  const endsAt = form.schedule.endsAt ? istInputToIso(form.schedule.endsAt) : null;
  if (form.schedule.startsAt && !startsAt) return { error: "The start date isn't complete." };
  if (form.schedule.endsAt && !endsAt) return { error: "The end date isn't complete." };
  const { pagesText: _p, excludeText: _e, ...targeting } = form.targeting;
  void _p;
  void _e;
  return {
    input: {
      ...form,
      name: form.name.trim(),
      countdown: { mode: form.show.countdown ? form.countdown.mode : form.countdown.mode, target: countdownTarget },
      targeting: { ...targeting, pages, excludePages: parsePageLines(form.targeting.excludeText) },
      schedule: { startsAt, endsAt },
    },
  };
}

/** Preview/visitor shape built from the editor state. */
export function formToPreview(form: PopupForm) {
  return {
    design: form.design,
    content: form.content,
    show: form.show,
    primaryCta: form.primaryCta,
    secondaryCta: form.secondaryCta,
  };
}
