import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "success"
    | "warning"
    | "info"
    | "neutral"
    | "danger";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          variant === "default" &&
            "border-transparent bg-primary text-primary-foreground",
          variant === "secondary" &&
            "border-transparent bg-secondary text-secondary-foreground",
          variant === "outline" &&
            "border border-border bg-card text-foreground",
          variant === "success" &&
            "border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
          variant === "warning" &&
            "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
          variant === "info" &&
            "border-transparent bg-primary-muted text-primary dark:bg-primary-muted dark:text-primary",
          variant === "neutral" &&
            "border-transparent bg-muted text-muted-foreground",
          variant === "danger" &&
            "border-transparent bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
