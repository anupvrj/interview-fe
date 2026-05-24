import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { appTableShell } from "@/lib/app-theme";

export function DataTableShell({
  title,
  description,
  toolbar,
  filters,
  children,
  footer,
  className,
}: {
  title?: string;
  description?: string;
  toolbar?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(appTableShell, className)}>
      {(title || description || toolbar) && (
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0 space-y-1">
            {title ? (
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {toolbar ? (
            <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
          ) : null}
        </div>
      )}
      {filters ? (
        <div className="border-b border-border bg-muted/30 px-4 py-3 sm:px-5">
          {filters}
        </div>
      ) : null}
      <div className="overflow-x-auto">{children}</div>
      {footer ? (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
