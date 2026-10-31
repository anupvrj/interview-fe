import { HACKATHON_SLUG } from "@/features/hackathon/config";
import type { BadgeTone, BroadcastAudience, BroadcastContent, BroadcastEvent, BroadcastInput, BroadcastStatus } from "./types";

export const BROADCASTS_ADMIN_PATH = "/super-admin/broadcasts";
export const DEFAULT_COOLDOWN_HOURS = 20;

export const AUDIENCE_OPTIONS: { value: BroadcastAudience; label: string; hint: string }[] = [
  { value: "hackathon_registered", label: "Registered for the hackathon", hint: "Everyone with an active registration." },
  { value: "hackathon_not_started", label: "Registered, not started yet", hint: "Registered but no challenge progress." },
  { value: "hackathon_not_submitted", label: "Registered, not submitted", hint: "Registered and haven't submitted the hackathon." },
  { value: "hackathon_submitted", label: "Submitted the hackathon", hint: "Finished and submitted." },
  { value: "hackathon_not_registered", label: "Users not registered for the hackathon", hint: "Have an InterviewTrix account, not in the hackathon." },
  {
    value: "launch_event_registered",
    label: "Registered for the 31 Oct live event",
    hint: "Launch event RSVPs from /product-launch (email list).",
  },
  {
    value: "engaged_or_launch_registered",
    label: "Did 1+ hackathon challenge, or registered for the live event",
    hint: "Your warmest audience: anyone who completed at least one challenge, plus every live event RSVP. Each address gets one email.",
  },
  { value: "all_except_submitted", label: "All users except those who submitted", hint: "Everyone who can still take part." },
  { value: "all_users", label: "All users", hint: "Every account with an email address." },
];

export const BADGE_TONE_OPTIONS: { value: BadgeTone; label: string }[] = [
  { value: "blue", label: "Blue" },
  { value: "teal", label: "Green" },
  { value: "gold", label: "Gold" },
  { value: "amber", label: "Amber" },
];

export const VARIABLES: { key: string; label: string }[] = [
  { key: "first_name", label: "First name" },
  { key: "name", label: "Full name" },
  { key: "hackathon_title", label: "Hackathon name" },
  { key: "ends_at", label: "Submission deadline" },
  { key: "starts_at", label: "Start time" },
  { key: "launch_date", label: "Launch date" },
  { key: "launch_time", label: "Launch time" },
  { key: "dashboard_url", label: "Challenge dashboard link" },
  { key: "hackathon_url", label: "Hackathon page link" },
  { key: "register_url", label: "Join link (landing page)" },
  { key: "whatsapp_url", label: "WhatsApp link" },
  { key: "add_to_calendar_url", label: "Add to Google Calendar link" },
  { key: "launch_join_url", label: "Google Meet / join link" },
  { key: "event_registration_url", label: "Event registration page" },
  { key: "event_title", label: "Event title" },
  { key: "event_date", label: "Event date" },
  { key: "event_time", label: "Event time" },
  { key: "event_duration", label: "Event length" },
  { key: "event_join_url", label: "Event join link" },
  { key: "event_calendar_url", label: "Event Google Calendar link" },
];

export const LINK_VARIABLES = [
  "{{dashboard_url}}",
  "{{hackathon_url}}",
  "{{register_url}}",
  "{{whatsapp_url}}",
  "{{add_to_calendar_url}}",
  "{{launch_join_url}}",
  "{{event_registration_url}}",
  "{{event_join_url}}",
  "{{event_calendar_url}}",
];

export const EVENT_DURATION_OPTIONS = [30, 45, 60, 90, 120, 150, 180].map((m) => ({
  value: String(m),
  label: m % 60 === 0 ? `${m / 60} hour${m === 60 ? "" : "s"}` : `${m} minutes`,
}));

export const STATUS_LABEL: Record<BroadcastStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sending: "Sending",
  sent: "Sent",
  cancelled: "Cancelled",
  failed: "Stopped",
};

export const STATUS_VARIANT: Record<BroadcastStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  scheduled: "info",
  sending: "warning",
  sent: "success",
  cancelled: "neutral",
  failed: "danger",
};

export function audienceLabel(type: BroadcastAudience): string {
  return AUDIENCE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

const emptyContent: BroadcastContent = {
  eyebrow: "",
  badgeLabel: "",
  badgeTone: "blue",
  title: "",
  titleAccent: "",
  body: "",
  highlight: "",
  ctaLabel: "",
  ctaUrl: "",
  secondaryCtaLabel: "",
  secondaryCtaUrl: "",
  showWhatsapp: false,
  footnote: "",
};

export const emptyEvent: BroadcastEvent = { title: "", startsAt: null, durationMinutes: 60, joinUrl: "" };

/** True when the email uses any {{event_*}} variable (the event fields are then required). */
export function usesEventVariables(input: Pick<BroadcastInput, "subject" | "preheader" | "content">): boolean {
  const texts = [input.subject, input.preheader, ...Object.values(input.content).filter((v): v is string => typeof v === "string")];
  return texts.some((t) => /\{\{\s*event_[a-z_]+\s*\}\}/i.test(t));
}

export interface BroadcastPreset {
  key: string;
  label: string;
  when: string;
  input: BroadcastInput;
}

const preset = (
  key: string,
  label: string,
  when: string,
  input: Omit<BroadcastInput, "content" | "audience" | "cooldownHours" | "event"> & {
    content: Partial<BroadcastContent>;
    audience: BroadcastAudience;
    event?: Partial<BroadcastEvent>;
  },
): BroadcastPreset => ({
  key,
  label,
  when,
  input: {
    ...input,
    content: { ...emptyContent, ...input.content },
    audience: { type: input.audience, hackathonSlug: HACKATHON_SLUG },
    event: { ...emptyEvent, ...input.event },
    cooldownHours: DEFAULT_COOLDOWN_HOURS,
  },
});

/** Ready-made hackathon updates. Everything stays editable. */
export const BROADCAST_PRESETS: BroadcastPreset[] = [
  preset("day1-live", "Day 1 · Hackathon is live", "To users who haven't registered yet", {
    name: "Day 1 — hackathon is live (not registered)",
    // Plain subject: no FREE / ₹ / emoji / ALL CAPS — those push mail into spam or promotions.
    subject: "The Hiring Games is live on InterviewTrix",
    preheader: "Build an ATS-ready resume, face the AI interviewer and join the live launch on {{launch_date}}.",
    audience: "hackathon_not_registered",
    content: {
      eyebrow: "Day 1",
      badgeLabel: "Live now",
      badgeTone: "teal",
      title: "The Hiring Games is",
      titleAccent: "live",
      body:
        "Hi {{first_name}},\n\n{{hackathon_title}} is live. Three steps, real prizes, and it's free to join.\n\n[[steps]]\n\n## Top 3 win · prize pool worth ₹20,000\n[[prizes]]\n\n## Live launch · {{launch_date}}, {{launch_time}}\nWinners are announced live, followed by a session on hiring in the age of AI with our guests.\n\n[[guests]]",
      highlight: "Submissions close **{{ends_at}}**.",
      ctaLabel: "Join the hackathon",
      ctaUrl: "{{hackathon_url}}",
      footnote:
        "Prizes follow the hackathon terms. Claude is a trademark of Anthropic and Amazon is a trademark of Amazon.com, Inc.; neither sponsors this event.",
    },
  }),
  preset("started", "Hackathon started · Start your challenge", "To registered participants", {
    name: "Hackathon started — start your challenge",
    subject: "It's on, {{first_name}} — start your first challenge",
    preheader: "Your challenges are unlocked on your dashboard.",
    audience: "hackathon_registered",
    content: {
      eyebrow: "Hackathon",
      badgeLabel: "Started",
      badgeTone: "blue",
      title: "Your challenges are",
      titleAccent: "unlocked",
      body:
        "Hi {{first_name}},\n\n{{hackathon_title}} has started and your dashboard is open. Work through the challenges in order.\n\n- Finish each challenge on your dashboard\n- Submit the hackathon before the deadline so your entry counts",
      highlight: "Deadline: **{{ends_at}}**.",
      ctaLabel: "Start your challenge",
      ctaUrl: "{{dashboard_url}}",
    },
  }),
  preset("day3-halfway", "Day 3 · Halfway there", "To everyone who hasn't submitted", {
    name: "Day 3 — halfway",
    subject: "Halfway through {{hackathon_title}}",
    preheader: "There's still time to finish — or to join.",
    audience: "all_except_submitted",
    content: {
      eyebrow: "Day 3",
      badgeLabel: "Halfway",
      badgeTone: "blue",
      title: "We're",
      titleAccent: "halfway there",
      body:
        "Hi {{first_name}},\n\n{{hackathon_title}} is halfway through. If you've started, keep going — finish the next challenge today. If you haven't joined yet, there's still time and registration is free.",
      highlight: "Submissions close **{{ends_at}}**.",
      ctaLabel: "Open the hackathon",
      ctaUrl: "{{hackathon_url}}",
    },
  }),
  preset("day6-closing", "Day 6 · About to close", "To everyone who hasn't submitted", {
    name: "Day 6 — closing soon",
    subject: "Last call: {{hackathon_title}} closes {{ends_at}}",
    preheader: "Finish your challenges and submit before the deadline.",
    audience: "all_except_submitted",
    content: {
      eyebrow: "Day 6",
      badgeLabel: "Closing soon",
      badgeTone: "amber",
      title: "Almost",
      titleAccent: "over",
      body:
        "Hi {{first_name}},\n\n{{hackathon_title}} closes soon. Finish your remaining challenges and **submit the hackathon** from your dashboard so your entry counts.",
      highlight: "Deadline: **{{ends_at}}**.",
      ctaLabel: "Finish and submit",
      ctaUrl: "{{hackathon_url}}",
    },
  }),
  preset("day7-over", "Day 7 · It's over, see you on the 31st", "Send after the 26 Oct deadline · to all users", {
    name: "Hackathon over — see you on the 31st",
    subject: "{{hackathon_title}} is over — see you on {{launch_date}}",
    preheader: "Winners are announced at the live launch.",
    audience: "all_users",
    content: {
      eyebrow: "Hackathon",
      badgeLabel: "Closed",
      badgeTone: "gold",
      title: "That's a wrap.",
      titleAccent: "Thank you",
      body:
        "Hi {{first_name}},\n\n{{hackathon_title}} has closed. Thank you to everyone who took part.\n\nWinners are announced at the live launch on **{{launch_date}}, {{launch_time}}**. We'll send the joining link closer to the date.",
      highlight: "Save the date: **{{launch_date}}, {{launch_time}}**.",
      showWhatsapp: true,
    },
  }),
  preset("launch-going-live-soon", "Launch · Going live in a few hours", "To live event RSVPs", {
    name: "Launch — going live soon",
    subject: "We're going live soon — {{launch_date}}, {{launch_time}}",
    preheader: "Add the session to your calendar and keep the join link handy.",
    audience: "launch_event_registered",
    content: {
      eyebrow: "Live event",
      badgeLabel: "Starting soon",
      badgeTone: "amber",
      title: "We're going live",
      titleAccent: "in a few hours",
      body:
        "Hi {{first_name}},\n\nOur **live event and product launch** for {{hackathon_title}} starts at **{{launch_time}}** on **{{launch_date}}**.\n\nWinners, product updates, and expert career advice — all online.",
      highlight: "Add the session to your calendar, then join from the link below when we go live.",
      ctaLabel: "Add to calendar",
      ctaUrl: "{{add_to_calendar_url}}",
      footnote: "Join here when we're live: [Join the session]({{launch_join_url}})",
    },
  }),
  preset("launch-event-reminder", "Launch · Event reminder", "To live event RSVPs and hackathon participants — fill in the event details, then send", {
    name: "Launch — event reminder",
    subject: "Don't miss it: {{event_title}}, {{event_date}} at {{event_time}}",
    preheader: "{{event_duration}} with people who hire, live Q&A, and the best question wins Claude Pro or an Amazon voucher.",
    audience: "engaged_or_launch_registered",
    event: { title: "InterviewTrix Live Launch & Hiring Games", startsAt: "2026-10-31T13:30:00.000Z", durationMinutes: 120 },
    content: {
      eyebrow: "Live event",
      badgeLabel: "Reminder",
      badgeTone: "amber",
      title: "See you live,",
      titleAccent: "{{first_name}}",
      body:
        "Give us **{{event_duration}}** at **{{event_title}}** and walk into your next interview knowing how hiring really works in the age of AI.\n\n## Why you shouldn't miss it\n- **Hear it from people who hire** — what gets candidates shortlisted now, and what quietly gets them rejected\n- **Live Q&A** — your toughest question about interviews, resumes or AI, answered on the spot\n- **Hiring Games winners revealed** — and what their entries got right\n- **First look at what's new in InterviewTrix** — ready to use for your next interview the same evening\n\n[[askwin]]\n\n## Your guests\n[[guests]]\n\n## Before you join\n- A laptop or phone with a stable connection, and Google Meet\n- One real question you want answered\n- Join 5 minutes early so you don't miss the start\n\n**Join here:**\n[{{event_join_url}}]({{event_join_url}})",
      highlight: "**{{event_date}}, {{event_time}}** · {{event_duration}} · online",
      ctaLabel: "Add to Google Calendar",
      ctaUrl: "{{event_calendar_url}}",
      secondaryCtaLabel: "Join on Google Meet",
      secondaryCtaUrl: "{{event_join_url}}",
      footnote:
        "The best question is picked by the hosts during the session. Claude is a trademark of Anthropic and Amazon is a trademark of Amazon.com, Inc.; neither sponsors this event.",
    },
  }),
  preset("launch-we-are-live", "Launch · We are live now", "To live event RSVPs and hackathon participants — send when the meeting is open", {
    name: "Launch — we are live",
    subject: "We're live — join {{event_title}} now",
    preheader: "Join now and bring a question: the best one wins Claude Pro or an Amazon gift voucher.",
    audience: "engaged_or_launch_registered",
    event: { title: "InterviewTrix Live Launch & Hiring Games", startsAt: "2026-10-31T13:30:00.000Z", durationMinutes: 120 },
    content: {
      eyebrow: "Live event",
      badgeLabel: "Live now",
      badgeTone: "teal",
      title: "We're live,",
      titleAccent: "{{first_name}}",
      body:
        "**{{event_title}}** has started — Hiring Games winners, product updates, and an expert session on hiring in the AI era.\n\n[[askwin]]",
      highlight: "**On air now** · tap below to join.",
      ctaLabel: "Join Live",
      ctaUrl: "{{event_join_url}}",
    },
  }),
  preset("whatsapp", "Join our WhatsApp community", "To registered participants", {
    name: "WhatsApp community invite",
    subject: "Join the {{hackathon_title}} WhatsApp community",
    preheader: "Updates, tips and the launch link — first.",
    audience: "hackathon_registered",
    content: {
      eyebrow: "Community",
      badgeLabel: "New",
      badgeTone: "teal",
      title: "Join us on",
      titleAccent: "WhatsApp",
      body:
        "Hi {{first_name}},\n\nWe've started a WhatsApp community for {{hackathon_title}} participants. It's where we share updates, tips and the launch event link first.",
      showWhatsapp: true,
    },
  }),
];

export function blankBroadcast(): BroadcastInput {
  return {
    name: "",
    subject: "",
    preheader: "",
    content: { ...emptyContent },
    audience: { type: "hackathon_registered", hackathonSlug: HACKATHON_SLUG },
    event: { ...emptyEvent },
    cooldownHours: DEFAULT_COOLDOWN_HOURS,
  };
}

export function toInput(b: BroadcastInput): BroadcastInput {
  return {
    name: b.name,
    subject: b.subject,
    preheader: b.preheader ?? "",
    content: { ...emptyContent, ...b.content },
    audience: { type: b.audience.type, hackathonSlug: b.audience.hackathonSlug ?? "" },
    event: { ...emptyEvent, ...b.event, startsAt: b.event?.startsAt ?? null, joinUrl: b.event?.joinUrl ?? "", title: b.event?.title ?? "" },
    cooldownHours: b.cooldownHours ?? DEFAULT_COOLDOWN_HOURS,
  };
}

export const EXCLUSION_LABELS: Record<keyof import("./types").BroadcastExclusions, string> = {
  cooldown: "Emailed recently (cooldown)",
  optedOut: "Unsubscribed",
  hackathonOptOut: "Turned off hackathon emails",
  suppressed: "Bounced or marked as spam",
  noEmail: "No valid email",
  duplicate: "Duplicate address",
};
