"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const LABEL_CLASS = "block text-xs font-medium leading-snug text-muted-foreground";

export const hackathonAdminControlClass = "h-11 w-full min-w-0";

/** Label above the control. Use inside 2-column grids so the input stays full-width. */
export function HackathonAdminField({
  id,
  label,
  hint,
  className,
  children,
}: {
  id?: string;
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </Label>
      <div className="min-w-0">{children}</div>
      {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Label left, control right on md+. Stacked on mobile. */
export function HackathonAdminFieldRow({
  id,
  label,
  hint,
  className,
  children,
}: {
  id?: string;
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-1.5 md:grid-cols-[11rem_minmax(0,1fr)] md:items-start md:gap-x-5 lg:grid-cols-[12rem_minmax(0,1fr)]",
        className,
      )}
    >
      <div className="md:pt-2.5">
        <Label htmlFor={id} className={cn(LABEL_CLASS, "leading-snug")}>
          {label}
        </Label>
        {hint ? <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
