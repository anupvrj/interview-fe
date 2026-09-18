"use client";

import type { ReactNode } from "react";
import { AnimateIn } from "@/components/marketing/about-us/AnimateIn";
import { cn } from "@/lib/utils";

type AboutSectionHeaderProps = {
  badge?: string;
  title: ReactNode;
  description?: string;
  className?: string;
  align?: "center" | "left";
};

export function AboutSectionHeader({
  badge,
  title,
  description,
  className,
  align = "center",
}: AboutSectionHeaderProps) {
  const isCenter = align === "center";

  return (
    <AnimateIn
      className={cn(
        "mb-10 sm:mb-14",
        isCenter ? "mx-auto max-w-3xl text-center" : "max-w-2xl",
        className,
      )}
    >
      {badge ? (
        <span className="mb-4 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {badge}
        </span>
      ) : null}
      <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </AnimateIn>
  );
}
