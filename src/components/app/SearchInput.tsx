"use client";

import type { ComponentProps } from "react";
import { forwardRef } from "react";
import { Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchInputProps = Omit<ComponentProps<"input">, "type"> & {
  containerClassName?: string;
  /** Defaults to Search */
  leadingIcon?: LucideIcon;
};

/**
 * Search field with a leading icon. Uses a flex shell so icon padding never fights
 * `.app-control` horizontal padding on the input.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    { className, containerClassName, disabled, leadingIcon: LeadingIcon = Search, ...props },
    ref,
  ) {
    return (
      <div
        className={cn(
          "app-control flex h-11 min-w-0 items-center gap-2.5 px-3",
          "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          disabled && "cursor-not-allowed opacity-50",
          containerClassName,
        )}
      >
        <LeadingIcon
          className="h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <input
          ref={ref}
          type="text"
          autoComplete="off"
          disabled={disabled}
          className={cn(
            "min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-foreground shadow-none outline-none",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-0",
            "disabled:cursor-not-allowed",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
