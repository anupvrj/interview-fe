"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  dashboardHeroVariants,
  type DashboardHeroVariant,
} from "@/components/app/dashboard-hero-variants";

function HeroOrb({
  orbBase,
  orbLight,
  orbDark,
  orbHighlight,
  orbShadow,
}: {
  orbBase: string;
  orbLight: string;
  orbDark: string;
  orbHighlight: string;
  orbShadow: string;
}) {
  const fillId = useId();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-4 -top-4 hidden h-44 w-44 sm:block lg:h-52 lg:w-52 xl:right-0 xl:top-0 xl:h-56 xl:w-56"
    >
      <svg
        viewBox="0 0 200 200"
        className="h-full w-full drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
        fill="none"
      >
        <defs>
          <radialGradient id={fillId} cx="38%" cy="34%" r="68%">
            <stop offset="0%" stopColor={orbHighlight} />
            <stop offset="28%" stopColor={orbLight} />
            <stop offset="58%" stopColor={orbBase} />
            <stop offset="100%" stopColor={orbShadow} />
          </radialGradient>
        </defs>

        <circle cx="100" cy="100" r="88" fill={`url(#${fillId})`} />

        <ellipse
          cx="74"
          cy="62"
          rx="28"
          ry="18"
          fill={orbHighlight}
          opacity="0.55"
          transform="rotate(-20 74 62)"
        />

        <circle
          cx="100"
          cy="100"
          r="88"
          stroke={orbDark}
          strokeWidth="2.5"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}

export function HeroPrimaryButton({
  heroVariant = "primary",
  className,
  ...props
}: Omit<ButtonProps, "variant"> & { heroVariant?: DashboardHeroVariant }) {
  const palette = dashboardHeroVariants[heroVariant];
  return (
    <Button
      {...props}
      className={cn(
        "border-0 font-semibold shadow-lg",
        palette.actionPrimary,
        className,
      )}
    />
  );
}

export function HeroOutlineButton({
  heroVariant = "primary",
  className,
  ...props
}: Omit<ButtonProps, "variant"> & { heroVariant?: DashboardHeroVariant }) {
  const palette = dashboardHeroVariants[heroVariant];
  return (
    <Button
      variant="outline"
      {...props}
      className={cn("font-semibold", palette.actionOutline, className)}
    />
  );
}

export function DashboardHero({
  eyebrow,
  title,
  description,
  actions,
  children,
  variant = "primary",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  variant?: DashboardHeroVariant;
  className?: string;
}) {
  const palette = dashboardHeroVariants[variant];

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 shadow-[0_4px_24px_0_rgba(34,41,47,0.12)] sm:p-8",
        palette.gradient,
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-black/10 blur-2xl"
      />
      <HeroOrb
        orbBase={palette.orbBase}
        orbLight={palette.orbLight}
        orbDark={palette.orbDark}
        orbHighlight={palette.orbHighlight}
        orbShadow={palette.orbShadow}
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-2xl space-y-2.5 text-left">
          {eyebrow ? (
            <p className="inline-flex w-fit items-center rounded-lg border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem] lg:text-3xl">
            {title}
          </h1>
          {description ? (
            <div className="max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base [&_a]:font-medium [&_a]:text-white [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-white/90">
              {description}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>

      {children ? (
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 [&>*]:rounded-xl [&>*]:border [&>*]:border-white/20 [&>*]:bg-white/15 [&>*]:p-4 [&>*]:text-white [&>*]:backdrop-blur-sm">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export { dashboardHeroVariants, type DashboardHeroVariant };
