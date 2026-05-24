import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HubStatGrid({
  children,
  className,
  columns = 4,
}: {
  children: ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
}) {
  const colClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 xl:grid-cols-4";

  return (
    <div
      className={cn("grid grid-cols-1 gap-4", colClass, className)}
    >
      {children}
    </div>
  );
}
