"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Instagram, Linkedin, RefreshCw } from "lucide-react";
import { INTERVIEWTRIX_PRODUCT_HUNT_URL } from "../social-links";
import { hkSecondaryButton } from "./ResumeChallenge";
import { ProductHuntLogo } from "./ReviewPlatformLogos";

function SocialActionButton({
  href,
  onClick,
  icon: Icon,
  label,
  accent = "default",
}: Readonly<{
  href?: string;
  onClick?: () => void;
  icon: typeof Linkedin;
  label: string;
  accent?: "linkedin" | "instagram" | "default";
}>) {
  const accentClass =
    accent === "linkedin"
      ? "border-[#0a66c2]/50 hover:border-[#0a66c2] hover:bg-[#0a66c2]/10"
      : accent === "instagram"
        ? "border-[#e1306c]/50 hover:border-[#e1306c] hover:bg-[#e1306c]/10"
        : "border-white/70 hover:border-white hover:bg-white/[0.06]";

  const iconClass =
    accent === "linkedin" ? "text-[#6fc0ff]" : accent === "instagram" ? "text-[#ff5f97]" : "text-[#4ee6cf]";

  const className = `${hkSecondaryButton} ${accentClass} w-full sm:w-auto sm:min-w-[11rem]`;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        <Icon className={`size-4 shrink-0 ${iconClass}`} aria-hidden />
        {label}
        <ExternalLink className="size-3.5 shrink-0 opacity-60" aria-hidden />
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon className={`size-4 shrink-0 ${iconClass}`} aria-hidden />
      {label}
    </button>
  );
}

export function SocialShareActions({
  caption,
  copied,
  onCopyCaption,
  onChangeCaption,
  onRegenerateCaption,
  onShareLinkedIn,
  onShareInstagram,
}: Readonly<{
  caption: string;
  copied: boolean;
  onCopyCaption: () => void;
  onChangeCaption: (caption: string) => void;
  onRegenerateCaption: () => void;
  onShareLinkedIn: () => void;
  onShareInstagram: () => void;
}>) {
  const [editingCaption, setEditingCaption] = useState(false);

  return (
    <div className="space-y-2">
      <p className="text-sm text-[#cfdbe8]">
        Share your experience on <strong className="text-white">LinkedIn</strong> and{" "}
        <strong className="text-white">Instagram</strong> with the suggested caption, and tag{" "}
        <strong className="text-white">@interviewtrix_official</strong>. Please keep each post public so we can view it.
      </p>
      <div className="pt-1">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7189a6]">Suggested caption</p>
          <div className="flex flex-wrap gap-2">
            {editingCaption ? (
              <button
                type="button"
                onClick={() => setEditingCaption(false)}
                className={`${hkSecondaryButton} min-h-9 px-3 text-xs`}
              >
                <Check className="size-3.5" aria-hidden />
                Done
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setEditingCaption(false);
                onRegenerateCaption();
              }}
              className={`${hkSecondaryButton} min-h-9 px-3 text-xs`}
            >
              <RefreshCw className="size-3.5" aria-hidden />
              Try another
            </button>
          </div>
        </div>
        {editingCaption ? (
          <textarea
            value={caption}
            onChange={(event) => onChangeCaption(event.target.value)}
            rows={16}
            autoFocus
            aria-label="Suggested caption"
            className="w-full resize-y rounded-lg border border-[#27547d] bg-[#071426] px-2.5 py-1.5 text-xs leading-relaxed text-[#dbe9f8] focus:border-[#2a7fd4] focus:outline-none focus:ring-2 focus:ring-[#1677ff]/40"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingCaption(true)}
            className="max-h-[32rem] w-full cursor-text overflow-y-auto whitespace-pre-wrap rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-left text-xs leading-relaxed text-[#9eb2ca] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ff]/40"
          >
            {caption}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <SocialActionButton icon={Linkedin} label="Share on LinkedIn" onClick={onShareLinkedIn} accent="linkedin" />
        <SocialActionButton icon={Instagram} label="Share on Instagram" onClick={onShareInstagram} accent="instagram" />
        <button type="button" onClick={onCopyCaption} className={hkSecondaryButton}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy caption"}
        </button>
      </div>
    </div>
  );
}

export function SocialFollowAndRateActions() {
  return (
    <div className="space-y-2 border-t border-[#27547d]/40 pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#7189a6]">Optional — support us</p>
        <span className="rounded-full border border-[#27547d]/60 bg-[#071426]/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#7189a6]">
          Not required
        </span>
      </div>
      <p className="text-sm leading-relaxed text-[#9eb2ca] sm:whitespace-nowrap">
        If InterviewTrix helped you, leave a review or upvote on our{" "}
        <span className="text-[#cfdbe8]">Product Hunt</span> page — it helps more people discover us.
      </p>
      <a
        href={INTERVIEWTRIX_PRODUCT_HUNT_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Review InterviewTrix on Product Hunt"
        className="group inline-flex w-fit items-center transition-[opacity,transform] duration-200 hover:opacity-95 active:scale-[0.99]"
      >
        <ProductHuntLogo />
      </a>
    </div>
  );
}
