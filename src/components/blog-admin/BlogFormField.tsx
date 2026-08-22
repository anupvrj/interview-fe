"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface BlogFormFieldProps {
  readonly label: string;
  readonly htmlFor?: string;
  readonly hint?: string;
  readonly className?: string;
  readonly stacked?: boolean;
  readonly children: React.ReactNode;
}

export function BlogFormField({
  label,
  htmlFor,
  hint,
  className,
  stacked = false,
  children,
}: BlogFormFieldProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-1.5 sm:gap-2",
        !stacked &&
          "md:grid-cols-[11rem_minmax(0,1fr)] md:items-start md:gap-x-5 lg:grid-cols-[12rem_minmax(0,1fr)]",
        className,
      )}
    >
      <div className={cn(!stacked && "md:pt-2.5")}>
        <Label
          htmlFor={htmlFor}
          className="text-sm font-medium leading-snug text-foreground"
        >
          {label}
        </Label>
        {hint ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export const blogControlClass = "h-11 w-full text-base sm:text-sm";
