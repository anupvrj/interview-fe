"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, ExternalLink, Instagram, Linkedin } from "lucide-react";
import { toast } from "sonner";
import {
  shareImageDownloadName,
  shareImageFullUrl,
  shareImagePreviewUrl,
  type SharePostImage,
} from "../share-images";
import { hkInputClass, hkSecondaryButton } from "./ResumeChallenge";

export type SharePlatform = "linkedin" | "instagram";

const PLATFORM = {
  linkedin: { name: "LinkedIn", icon: Linkedin, iconClass: "text-[#6fc0ff]", placeholder: "https://www.linkedin.com/posts/…" },
  instagram: { name: "Instagram", icon: Instagram, iconClass: "text-[#ff5f97]", placeholder: "https://www.instagram.com/p/…" },
} as const;

/**
 * One share step: the image to save, the text to copy, a button to open the app, and the
 * box for the post link. Phones that can share files save the image through the share
 * sheet ("Save image"); others download it. Inside Instagram's browser neither may work, so
 * after a try it says to press and hold the image.
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
  const [copied, setCopied] = useState(false);
  const [triedSave, setTriedSave] = useState(false);
  const [canShareFile, setCanShareFile] = useState(false);

  useEffect(() => {
    try {
      const probe = new File([new Blob([""], { type: "image/png" })], "probe.png", { type: "image/png" });
      setCanShareFile(typeof navigator.canShare === "function" && navigator.canShare({ files: [probe] }));
    } catch {
      setCanShareFile(false);
    }
  }, []);

  const copyText = async (quiet = false) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (!quiet) toast.success("Text copied");
    } catch {
      if (!quiet) toast.error("Couldn't copy. Press and hold the text to copy it.");
    }
  };

  const saveImage = async () => {
    setTriedSave(true);
    try {
      const blob = await (await fetch(shareImageFullUrl(image))).blob();
      const file = new File([blob], shareImageDownloadName(image), { type: blob.type || "image/png" });
      if (canShareFile) {
        await navigator.share({ files: [file] });
        return;
      }
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") window.open(shareImageFullUrl(image), "_blank", "noopener,noreferrer");
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
          <button type="button" onClick={() => void copyText()} className={`${hkSecondaryButton} min-h-11 w-full`}>
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied" : "Copy text"}
          </button>
        </div>
      </div>

      <a
        href={openUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => void copyText(true)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#6fc0ff] hover:text-white"
      >
        <p.icon className={`size-4 ${p.iconClass}`} aria-hidden />
        Open {p.name} and post
        <ExternalLink className="size-3.5 opacity-70" aria-hidden />
      </a>

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
