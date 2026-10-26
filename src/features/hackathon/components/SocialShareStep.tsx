"use client";

import { useState } from "react";
import { Check, Copy, Download, ExternalLink, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { openLinkedInShareCompose } from "../social-links";
import {
  downloadSharePostImageFile,
  fetchSharePostImageFile,
  shareImageFullUrl,
  shareImagePreviewUrl,
  type SharePostImage,
} from "../share-images";
import { cn } from "@/lib/utils";
import { hkInputClass, hkSecondaryButton } from "./ResumeChallenge";

export type SharePlatform = "linkedin";

const PLATFORM = {
  linkedin: { name: "LinkedIn", icon: Linkedin, iconClass: "text-[#6fc0ff]", placeholder: "https://www.linkedin.com/posts/…" },
} as const;

export function ShareCopyButton({
  text,
  className,
}: Readonly<{ text: string; className?: string }>) {
  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Text copied");
    } catch {
      toast.error("Couldn't copy. Press and hold the text to copy it.");
    }
  };

  return (
    <button type="button" onClick={() => void copyText()} className={className ?? `${hkSecondaryButton} min-h-10 text-sm`}>
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? "Copied" : "Copy text"}
    </button>
  );
}

/**
 * One share step: preview image, download PNG, copy/open LinkedIn, paste post link.
 */
export function SocialShareStep({
  platform,
  image,
  text,
  openUrl,
  link,
  onLinkChange,
}: Readonly<{
  platform: SharePlatform;
  image: SharePostImage;
  text: string;
  openUrl: string;
  link: string;
  onLinkChange: (value: string) => void;
}>) {
  const p = PLATFORM[platform];
  const [triedSave, setTriedSave] = useState(false);

  const saveImage = async () => {
    setTriedSave(true);
    try {
      const file = await fetchSharePostImageFile(image);
      downloadSharePostImageFile(file);
      toast.success("Image downloaded — attach it in your LinkedIn post.");
    } catch {
      window.open(shareImageFullUrl(image), "_blank", "noopener,noreferrer");
      toast.message("Opened the full image in a new tab — save it from there if needed.");
    }
  };

  const shareOnLinkedIn = async () => {
    try {
      await openLinkedInShareCompose({ fullText: text, composeUrl: openUrl });
      toast.success("Caption copied. Use Save image to download the photo, then attach it in LinkedIn.");
    } catch {
      toast.error("Couldn't open LinkedIn. Copy the text and use Save image, then try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shareImagePreviewUrl(image)}
            alt={`Post image: ${image.label}`}
            width={1080}
            height={1080}
            className="mx-auto aspect-square w-full max-w-[10rem] rounded-xl sm:max-w-[13rem] border border-[#27547d]/80 bg-[#040b17] object-cover"
          />
          <button type="button" onClick={() => void saveImage()} className={`${hkSecondaryButton} min-h-11 w-full`}>
            <Download className="size-4" aria-hidden />
            Save image
          </button>
          {triedSave ? (
            <p className="text-center text-xs text-[#7189a6]">Didn&apos;t save? Press and hold the image.</p>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="hk-modal-panel max-h-28 flex-1 overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#27547d]/80 bg-[#040b17] px-3 py-2.5 text-xs leading-relaxed text-[#cfdbe8] select-text sm:max-h-[13rem]">
            {text}
          </p>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void shareOnLinkedIn()}
              className={cn(hkSecondaryButton, "min-h-12 w-full max-w-md text-base sm:min-w-[18rem]")}
            >
              <p.icon className={`size-4 ${p.iconClass}`} aria-hidden />
              Share on LinkedIn
              <ExternalLink className="size-3.5 opacity-70" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor={`hk-${platform}`} className="block text-sm font-semibold text-[#dbe9f8]">
          Paste your {p.name} post link
        </label>
        <input
          id={`hk-${platform}`}
          type="url"
          inputMode="url"
          value={link}
          onChange={(e) => onLinkChange(e.target.value)}
          placeholder={p.placeholder}
          className={hkInputClass}
        />
      </div>
    </div>
  );
}
