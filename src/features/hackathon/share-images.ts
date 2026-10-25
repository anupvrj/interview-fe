/**
 * Ready-made post images (1080×1080) in public/hackathon-2026/instagram-post-images.
 * The page shows the JPEG in preview/ (1080px, so a long-press inside Instagram's browser
 * still saves a full-size image); saving gives the original PNG. The thumb/ JPEGs (160px)
 * are no longer shown. To add an image: drop the PNG in the folder, make its preview/ JPEG,
 * and list it here.
 */
const IMAGE_DIR = "/hackathon-2026/instagram-post-images";

export const SHARE_POST_IMAGES = [
  { id: "IX_HG_Share_1_AIInterviewer", label: "AI interviewer" },
  { id: "IX_HG_Share_2_ParticipantBadge", label: "Completed badge" },
  { id: "IX_HG_Share_3_HackathonPass", label: "Hackathon pass" },
  { id: "IX_HG_Share_4_ChallengeAccepted", label: "Challenge accepted" },
  { id: "IX_HG_Share_5_BuildPracticeHired", label: "Build. Practice. Get hired." },
  { id: "IX_HG_Share_6_JustCompleted", label: "Just completed" },
  { id: "IX_HG_Share_7_LightProud", label: "So happy I completed" },
] as const;

export type SharePostImage = (typeof SHARE_POST_IMAGES)[number];

export const shareImageFullUrl = (img: SharePostImage) => `${IMAGE_DIR}/${img.id}.png`;
export const shareImagePreviewUrl = (img: SharePostImage) => `${IMAGE_DIR}/preview/${img.id}.jpg`;
export const shareImageDownloadName = (img: SharePostImage) =>
  `InterviewTrix-HiringGames-${img.id.replace(/^IX_HG_Share_\d+_/, "")}.png`;

export function randomSharePostImage(): SharePostImage {
  return SHARE_POST_IMAGES[Math.floor(Math.random() * SHARE_POST_IMAGES.length)];
}
