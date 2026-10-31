export type BroadcastAudience =
  | "all_users"
  | "all_except_submitted"
  | "hackathon_not_registered"
  | "hackathon_registered"
  | "hackathon_not_started"
  | "hackathon_not_submitted"
  | "hackathon_submitted"
  | "launch_event_registered"
  | "engaged_or_launch_registered";

export type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled" | "failed";
export type RecipientStatus = "queued" | "sending" | "sent" | "skipped" | "failed";
export type BadgeTone = "blue" | "teal" | "gold" | "amber";

export interface BroadcastContent {
  eyebrow: string;
  badgeLabel: string;
  badgeTone: BadgeTone;
  title: string;
  titleAccent: string;
  body: string;
  highlight: string;
  ctaLabel: string;
  ctaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  showWhatsapp: boolean;
  footnote: string;
}

export interface BroadcastExclusions {
  noEmail: number;
  suppressed: number;
  optedOut: number;
  hackathonOptOut: number;
  cooldown: number;
  duplicate: number;
}

export interface BroadcastInput {
  name: string;
  subject: string;
  preheader: string;
  content: BroadcastContent;
  audience: { type: BroadcastAudience; hackathonSlug: string };
  cooldownHours: number;
}

export interface EmailBroadcast extends BroadcastInput {
  _id: string;
  status: BroadcastStatus;
  scheduledAt: string | null;
  testSentAt: string | null;
  testSentTo: string[];
  testedCurrent: boolean;
  stats: { total: number; sent: number; skipped: number; failed: number };
  exclusions: BroadcastExclusions | null;
  startedAt: string | null;
  finishedAt: string | null;
  cancelledAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AudiencePreview {
  count: number;
  exclusions: BroadcastExclusions;
  sample: string[];
}

export interface BroadcastRecipientRow {
  _id: string;
  email: string;
  name: string;
  status: RecipientStatus;
  reason: string | null;
  sentAt: string | null;
  error: string | null;
  unsubscribedAt: string | null;
}

export interface BroadcastSettings {
  whatsappUrl: string;
  whatsappQrUrl: string;
}
