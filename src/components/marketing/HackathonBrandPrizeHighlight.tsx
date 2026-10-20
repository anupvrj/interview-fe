import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { AmazonGiftIcon, ClaudeBurstIcon } from "@/components/hackathon-2026/hackathonRewardIcons";
import { cn } from "@/lib/utils";

type HackathonBrandPrizeHighlightProps = {
  className?: string;
  /** Show InterviewTrix credits as a third prize (footer promo). */
  showCredits?: boolean;
};

/** Inline “WIN Claude Max + amazon ₹2,000 Gift Voucher” row (matches Hiring Games prize art). */
export function HackathonBrandPrizeHighlight({
  className,
  showCredits = false,
}: HackathonBrandPrizeHighlightProps) {
  return (
    <div
      className={cn("ixp-brand-prize-row", className)}
      aria-label="Top prizes include Claude Max subscription, Amazon gift voucher, and InterviewTrix credits"
    >
      <span className="ixp-brand-win">Win</span>

      <span className="ixp-brand-item">
        <ClaudeBurstIcon className="ixp-brand-claude-icon" />
        <span className="ixp-brand-claude-text">
          Claude <span className="ixp-brand-claude-accent">Max</span>
        </span>
      </span>

      <span className="ixp-brand-plus" aria-hidden>
        +
      </span>

      <span className="ixp-brand-item ixp-brand-amazon-wrap">
        <AmazonGiftIcon className="ixp-brand-amazon-icon" />
        <span className="ixp-brand-voucher">₹2,000 Gift Voucher</span>
      </span>

      {showCredits ? (
        <>
          <span className="ixp-brand-plus" aria-hidden>
            +
          </span>
          <span className="ixp-brand-item">
            <InterviewTrixLogo variant="icon" className="ixp-brand-ix-icon" />
            <span className="ixp-brand-credits">InterviewTrix credits</span>
          </span>
        </>
      ) : null}
    </div>
  );
}
