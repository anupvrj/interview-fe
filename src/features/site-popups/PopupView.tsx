"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { ArrowRight, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { hackathonReelFontVars } from "@/lib/fonts/hackathon-reel";
import type { PopupCta, PublicSitePopup } from "./types";
import { isModalDesign } from "./rules";
import { pad2, useCountdown, type CountdownParts } from "./useCountdown";
import "./site-popups.css";

export type PopupViewProps = {
  popup: Pick<PublicSitePopup, "design" | "content" | "show" | "primaryCta" | "secondaryCta">;
  /** Resolved countdown target (ISO) — null hides the countdown. */
  countdownTarget: string | null;
  countdownLabel: string;
  /** Server clock minus device clock, in ms. */
  clockOffsetMs?: number;
  /** Rendered inside a box (admin preview) instead of fixed to the viewport. */
  contained?: boolean;
  onClose: () => void;
  onCta: (which: "primary" | "secondary") => void;
};


/* ---------------------------------------------------------------- pieces */

function Eyebrow({ text }: { text: string }) {
  if (!text) return null;
  return (
    <span className="ixp-eyebrow">
      <i aria-hidden />
      {text}
    </span>
  );
}

function Title({ id, title, accent, className }: { id: string; title: string; accent: string; className?: string }) {
  if (!title && !accent) return null;
  return (
    <h2 id={id} className={cn("ixp-title", className)}>
      {title}
      {title && accent ? " " : null}
      {accent ? <span className="ixp-grad">{accent}</span> : null}
    </h2>
  );
}

function Body({ text }: { text: string }) {
  if (!text) return null;
  return <p className="ixp-body">{text}</p>;
}

function Price({ now, was, compact }: { now: string; was: string; compact?: boolean }) {
  if (!now && !was) return null;
  return (
    <p className={cn("ixp-price", compact && "ixp-price-sm")}>
      {now ? <span className="ixp-price-now">{now}</span> : null}
      {was ? (
        <span className="ixp-price-was">
          <span className="sr-only">was </span>
          {was}
        </span>
      ) : null}
    </p>
  );
}

function Prize({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  if (!value) return null;
  return (
    <div className={cn("ixp-prize", compact && "ixp-prize-sm")}>
      <Trophy className="ixp-prize-icon" aria-hidden />
      <div className="min-w-0">
        {label ? <p className="ixp-prize-label">{label}</p> : null}
        <p className="ixp-prize-value">{value}</p>
      </div>
    </div>
  );
}

function Countdown({ parts, label, variant = "tiles" }: { parts: CountdownParts | null; label: string; variant?: "tiles" | "inline" }) {
  if (!parts || parts.done) return null;
  const cells: Array<[number, string, string]> = [
    [parts.days, "Days", "d"],
    [parts.hours, "Hrs", "h"],
    [parts.minutes, "Min", "m"],
    [parts.seconds, "Sec", "s"],
  ];
  if (variant === "inline") {
    return (
      <div className="ixp-cd-inline" role="timer" aria-live="off">
        {label ? <span className="ixp-cd-inline-label">{label}</span> : null}
        <span className="ixp-cd-inline-digits">
          {cells.map(([v, , unit]) => (
            <span key={unit}>
              {pad2(v)}
              <small>{unit}</small>
            </span>
          ))}
        </span>
      </div>
    );
  }
  return (
    <div className="ixp-cd" role="timer" aria-live="off">
      {label ? <p className="ixp-cd-label">{label}</p> : null}
      <div className="ixp-cd-row">
        {cells.map(([v, name]) => (
          <div key={name} className="ixp-cd-cell">
            <span className="ixp-cd-num">{pad2(v)}</span>
            <span className="ixp-cd-unit">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaButton({ cta, onClick, size = "md", className }: { cta: PopupCta; onClick: () => void; size?: "sm" | "md" | "lg"; className?: string }) {
  if (!cta.label) return null;
  return (
    <button type="button" onClick={onClick} className={cn("ixp-btn", `ixp-btn-${size}`, className)}>
      <span>{cta.label}</span>
      <ArrowRight className="ixp-btn-arrow" aria-hidden />
    </button>
  );
}

function GhostButton({ cta, onClick, className }: { cta: PopupCta & { enabled: boolean }; onClick: () => void; className?: string }) {
  if (!cta.enabled || !cta.label) return null;
  return (
    <button type="button" onClick={onClick} className={cn("ixp-ghost", className)}>
      {cta.label}
    </button>
  );
}

function CloseButton({ onClose, refEl }: { onClose: () => void; refEl?: React.Ref<HTMLButtonElement> }) {
  return (
    <button ref={refEl} type="button" onClick={onClose} className="ixp-close" aria-label="Close">
      <X className="size-4" aria-hidden />
    </button>
  );
}

function Footnote({ text }: { text: string }) {
  if (!text) return null;
  return <p className="ixp-foot">{text}</p>;
}

/* ---------------------------------------------------------------- designs */

export function PopupView({ popup, countdownTarget, countdownLabel, clockOffsetMs = 0, contained, onClose, onCta }: PopupViewProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const parts = useCountdown(popup.show.countdown ? countdownTarget : null, clockOffsetMs);
  const { content: c, show, design } = popup;
  const modal = isModalDesign(design);

  useEffect(() => {
    if (contained) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [contained, onClose]);

  const price = show.price ? <Price now={c.priceNow} was={c.priceOriginal} /> : null;
  const prize = show.prize ? <Prize label={c.prizeLabel} value={c.prizeValue} /> : null;
  const primary = <CtaButton cta={popup.primaryCta} onClick={() => onCta("primary")} size="lg" />;
  const secondary = <GhostButton cta={popup.secondaryCta} onClick={() => onCta("secondary")} />;

  let panel: ReactNode;
  switch (design) {
    case "split":
      panel = (
        <div className="ixp-panel ixp-split">
          <CloseButton onClose={onClose} refEl={closeRef} />
          <div className="ixp-split-visual">
            {c.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-supplied promo image
              <img src={c.imageUrl} alt={c.imageAlt} className="ixp-split-img" />
            ) : (
              <div className="ixp-split-poster">
                <div className="ixp-floor" aria-hidden />
                {show.prize && c.prizeValue ? (
                  <>
                    <Trophy className="ixp-poster-trophy" aria-hidden />
                    {c.prizeLabel ? <p className="ixp-prize-label">{c.prizeLabel}</p> : null}
                    <p className="ixp-poster-value">{c.prizeValue}</p>
                  </>
                ) : (
                  <p className="ixp-poster-value ixp-grad">{c.titleAccent || c.title}</p>
                )}
                <Countdown parts={parts} label={countdownLabel} />
              </div>
            )}
          </div>
          <div className="ixp-split-body">
            <Eyebrow text={c.eyebrow} />
            <Title id={titleId} title={c.title} accent={c.titleAccent} />
            <Body text={c.body} />
            {price}
            {c.imageUrl ? (
              <>
                {prize}
                <Countdown parts={parts} label={countdownLabel} />
              </>
            ) : null}
            <div className="ixp-actions">
              {primary}
              {secondary}
            </div>
            <Footnote text={c.footnote} />
          </div>
        </div>
      );
      break;

    case "banner":
      panel = (
        <div className="ixp-panel ixp-banner">
          <div className="ixp-banner-main">
            <Eyebrow text={c.eyebrow} />
            <Title id={titleId} title={c.title} accent={c.titleAccent} className="ixp-title-sm" />
          </div>
          <div className="ixp-banner-meta">
            {show.price ? <Price now={c.priceNow} was={c.priceOriginal} compact /> : null}
            {show.prize && c.prizeValue ? (
              <span className="ixp-banner-prize">
                <Trophy className="size-4" aria-hidden />
                {c.prizeValue}
              </span>
            ) : null}
            <Countdown parts={parts} label={countdownLabel} variant="inline" />
          </div>
          <div className="ixp-banner-cta">
            <CtaButton cta={popup.primaryCta} onClick={() => onCta("primary")} size="sm" />
            <CloseButton onClose={onClose} refEl={closeRef} />
          </div>
        </div>
      );
      break;

    case "sheet":
      panel = (
        <div className="ixp-panel ixp-sheet">
          <span className="ixp-sheet-handle" aria-hidden />
          <CloseButton onClose={onClose} refEl={closeRef} />
          <Eyebrow text={c.eyebrow} />
          <Title id={titleId} title={c.title} accent={c.titleAccent} />
          <Body text={c.body} />
          <div className="ixp-sheet-row">
            {price}
            {show.prize ? <Prize label={c.prizeLabel} value={c.prizeValue} compact /> : null}
          </div>
          <Countdown parts={parts} label={countdownLabel} />
          <div className="ixp-actions ixp-actions-stack">
            {primary}
            {secondary}
          </div>
          <Footnote text={c.footnote} />
        </div>
      );
      break;

    case "corner":
      panel = (
        <div className="ixp-panel ixp-corner">
          <CloseButton onClose={onClose} refEl={closeRef} />
          <Eyebrow text={c.eyebrow} />
          <Title id={titleId} title={c.title} accent={c.titleAccent} className="ixp-title-sm" />
          {show.price ? <Price now={c.priceNow} was={c.priceOriginal} compact /> : null}
          {show.prize && c.prizeValue ? (
            <p className="ixp-corner-prize">
              <Trophy className="size-4" aria-hidden />
              {c.prizeLabel ? `${c.prizeLabel} · ` : ""}
              <b>{c.prizeValue}</b>
            </p>
          ) : null}
          <Countdown parts={parts} label={countdownLabel} variant="inline" />
          <div className="ixp-actions">
            <CtaButton cta={popup.primaryCta} onClick={() => onCta("primary")} size="sm" className="w-full" />
          </div>
        </div>
      );
      break;

    case "minimal":
      panel = (
        <div className="ixp-panel ixp-minimal">
          <CloseButton onClose={onClose} refEl={closeRef} />
          <Eyebrow text={c.eyebrow} />
          <Title id={titleId} title={c.title} accent={c.titleAccent} />
          <Body text={c.body} />
          {price}
          {show.prize && c.prizeValue ? (
            <p className="ixp-corner-prize ixp-center">
              <Trophy className="size-4" aria-hidden />
              {c.prizeLabel ? `${c.prizeLabel} · ` : ""}
              <b>{c.prizeValue}</b>
            </p>
          ) : null}
          <Countdown parts={parts} label={countdownLabel} variant="inline" />
          <div className="ixp-actions ixp-actions-center">
            {primary}
            {secondary}
          </div>
          <Footnote text={c.footnote} />
        </div>
      );
      break;

    case "spotlight":
    default:
      panel = (
        <div className="ixp-panel ixp-spotlight">
          <div className="ixp-floor" aria-hidden />
          <div className="ixp-rail" aria-hidden>
            <span className="on" />
            <span className="run" />
            <span />
            <span />
            <span />
          </div>
          <CloseButton onClose={onClose} refEl={closeRef} />
          <Eyebrow text={c.eyebrow} />
          <Title id={titleId} title={c.title} accent={c.titleAccent} />
          <Body text={c.body} />
          {price}
          {prize || (parts && !parts.done) ? (
            <div className="ixp-spot-grid">
              {prize}
              <Countdown parts={parts} label={countdownLabel} />
            </div>
          ) : null}
          <div className="ixp-actions ixp-actions-center">
            {primary}
            {secondary}
          </div>
          <Footnote text={c.footnote} />
        </div>
      );
  }

  return (
    <div
      className={cn("ixp-root", hackathonReelFontVars, `ixp-d-${design}`, contained && "ixp-contained")}
      role={modal ? "dialog" : "region"}
      aria-modal={modal && !contained ? true : undefined}
      aria-labelledby={titleId}
      aria-label={modal ? undefined : "Announcement"}
    >
      {modal ? <div className="ixp-backdrop" onClick={onClose} aria-hidden /> : null}
      {panel}
    </div>
  );
}
