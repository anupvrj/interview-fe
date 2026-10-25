"use client";

import { INTERVIEWTRIX_PRODUCT_HUNT_URL } from "../social-links";
import { ProductHuntLogo } from "./ReviewPlatformLogos";

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
        className="group inline-flex w-fit items-center transition-[opacity,transform] duration-200 hover:opacity-95"
      >
        <ProductHuntLogo />
      </a>
    </div>
  );
}
