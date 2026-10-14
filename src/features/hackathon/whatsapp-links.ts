import { HACKATHON_WHATSAPP_LINKS } from "@/lib/hackathon-2026-content";

/** Broadcast channel for winner announcements and live-event updates. */
export const HACKATHON_WHATSAPP_CHANNEL_URL =
  process.env.NEXT_PUBLIC_HACKATHON_WHATSAPP_CHANNEL_URL?.trim() || HACKATHON_WHATSAPP_LINKS.channelUrl;

/** Community group for participant updates and Q&A. */
export const HACKATHON_WHATSAPP_COMMUNITY_URL =
  process.env.NEXT_PUBLIC_HACKATHON_WHATSAPP_COMMUNITY_URL?.trim() || HACKATHON_WHATSAPP_LINKS.communityUrl;

export function hackathonWhatsAppCommunityQrUrl(inviteUrl: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&data=${encodeURIComponent(inviteUrl)}`;
}
