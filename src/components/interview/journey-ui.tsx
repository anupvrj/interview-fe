"use client";

/**
 * One look for every step of the interview journey — setup, live room dialogs,
 * feedback, processing, report — taken from the interview start form: elevated
 * card, soft violet gradient header, small uppercase eyebrow, semibold title,
 * muted description, rounded icon tiles, and one loader style everywhere.
 */
import type { ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { appCardElevated, appPrimaryButton, appSurfaceMuted } from "@/lib/app-theme";

export type JourneyTone = "brand" | "success" | "warning" | "danger";

const TONE_TILE: Record<JourneyTone, string> = {
  brand: "bg-[#7367F0]/12 text-[#7367F0] dark:bg-[#7367F0]/20 dark:text-[#a59cf7]",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/15 text-red-600 dark:text-red-400",
};

/** Class bundles for places that must keep their own elements (e.g. Radix dialog titles). */
export const journey = {
  card: cn(appCardElevated, "overflow-hidden"),
  headerBand:
    "border-b border-border/60 bg-gradient-to-br from-[#7367F0]/10 via-transparent to-transparent px-5 py-5 text-center sm:px-6",
  eyebrow: "text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7367F0] dark:text-[#a59cf7]",
  title: "text-lg font-semibold text-foreground sm:text-xl",
  description: "mx-auto mt-1 max-w-md text-sm text-muted-foreground",
  body: "px-5 py-5 sm:px-6",
  footer: "flex flex-col-reverse gap-3 border-t border-border/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6",
  primaryButton: cn("h-11 px-6 text-sm font-semibold", appPrimaryButton),
  /** AlertDialogContent / DialogContent: no default padding, the sections pad themselves. */
  dialog:
    "gap-0 overflow-hidden rounded-xl border border-border/80 bg-card p-0 text-card-foreground shadow-header",
  tile: (tone: JourneyTone = "brand", size: "md" | "lg" = "md") =>
    cn(
      "mx-auto flex shrink-0 items-center justify-center rounded-xl",
      size === "lg" ? "h-14 w-14" : "h-11 w-11",
      TONE_TILE[tone],
    ),
};

/** The rounded icon square used above titles. */
export function JourneyIconTile({
  tone = "brand",
  size = "md",
  children,
  className,
}: {
  tone?: JourneyTone;
  size?: "md" | "lg";
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn(journey.tile(tone, size), className)}>{children}</span>;
}

/** Spinner inside a brand tile — the one loader for the whole journey. */
export function JourneySpinner({ size = "md", className }: { size?: "md" | "lg"; className?: string }) {
  return (
    <JourneyIconTile size={size} className={className}>
      <Loader2 className={cn("animate-spin", size === "lg" ? "h-7 w-7" : "h-5 w-5")} aria-hidden />
    </JourneyIconTile>
  );
}

/** Gradient header: optional icon, eyebrow, title, description. */
export function JourneyHeader({
  icon,
  eyebrow,
  title,
  description,
  className,
}: {
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(journey.headerBand, className)}>
      {icon ? <div className="mb-3">{icon}</div> : null}
      {eyebrow ? <p className={journey.eyebrow}>{eyebrow}</p> : null}
      <h2 className={cn(journey.title, eyebrow ? "mt-2" : "")}>{title}</h2>
      {description ? <p className={journey.description}>{description}</p> : null}
    </div>
  );
}

/** Elevated card with the gradient header; children go in the padded body. */
export function JourneyCard({
  icon,
  eyebrow,
  title,
  description,
  children,
  footer,
  className,
}: {
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(journey.card, className)}>
      <JourneyHeader icon={icon} eyebrow={eyebrow} title={title} description={description} />
      {children ? <div className={journey.body}>{children}</div> : null}
      {footer ? <div className={journey.footer}>{footer}</div> : null}
    </div>
  );
}

/**
 * The journey loader. `page` centres a small card in the content area,
 * `overlay` covers the screen (e.g. between "View report" and the next page),
 * `inline` is just the spinner and text for use inside an existing card.
 */
export function JourneyLoader({
  title,
  description,
  variant = "page",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  variant?: "page" | "overlay" | "inline";
  className?: string;
}) {
  const content = (
    <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
      <JourneySpinner size="lg" />
      <p className={cn(journey.title, "mt-4 text-base sm:text-lg")}>{title}</p>
      {description ? <p className={journey.description}>{description}</p> : null}
    </div>
  );
  if (variant === "inline") return <div className={cn("py-6", className)}>{content}</div>;
  const card = <div className={cn(journey.card, "w-full max-w-sm px-6 py-8")}>{content}</div>;
  if (variant === "overlay") {
    return (
      <div
        className={cn(
          "fixed inset-0 z-[200] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm",
          className,
        )}
      >
        {card}
      </div>
    );
  }
  return <div className={cn("flex min-h-[60vh] items-center justify-center p-4", className)}>{card}</div>;
}

/** A progress row: done (check), active (spinner) or pending (empty). */
export function JourneyStep({
  state,
  title,
  description,
}: {
  state: "done" | "active" | "pending";
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className={cn(appSurfaceMuted, "flex items-start gap-3 px-4 py-3 text-left")}>
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          state === "done" && TONE_TILE.success,
          state === "active" && TONE_TILE.brand,
          state === "pending" && "bg-muted text-muted-foreground",
        )}
      >
        {state === "done" ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : state === "active" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <span className="h-2 w-2 rounded-full bg-current opacity-50" />
        )}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? <p className="text-xs text-muted-foreground sm:text-sm">{description}</p> : null}
      </div>
    </div>
  );
}
