"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Sentinel for optional / “all” filter values (Radix Select requires non-empty item values). */
export const APP_SELECT_EMPTY = "__app_select_empty__";

export type AppSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type AppSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly AppSelectOption[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  /** When true, prepends an empty-value option (maps to `""` in onChange). */
  allowEmpty?: boolean;
  emptyLabel?: string;
  /** Prefer opening below the trigger (helps standalone forms vs flipping upward). */
  menuSide?: "top" | "bottom";
  /** Hackathon launch / event registration dark panel styling. */
  variant?: "default" | "hackathon";
};

export function AppSelect({
  id,
  value,
  onChange,
  options,
  disabled,
  className,
  placeholder = "Select…",
  allowEmpty,
  emptyLabel = "All",
  menuSide = "bottom",
  variant = "default",
}: AppSelectProps) {
  const selectValue = allowEmpty && value === "" ? APP_SELECT_EMPTY : value;
  const isHackathon = variant === "hackathon";

  return (
    <Select
      value={selectValue}
      onValueChange={(next) => onChange(next === APP_SELECT_EMPTY ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        className={cn(
          "w-full",
          isHackathon &&
            "!border-[#27547d]/80 !bg-[#081a33]/90 !text-white shadow-none focus-visible:!border-[#3aa6ff] focus-visible:!ring-[#3aa6ff]/30 [&>span]:line-clamp-2 [&>span]:whitespace-normal [&>span]:text-left [&_svg]:text-[#9eb2ca]",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        side={menuSide}
        sideOffset={6}
        collisionPadding={16}
        align="start"
        className={cn(
          isHackathon &&
            "z-[250] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] border-[#27547d]/90 bg-[#071426] text-[#dbe9f8] shadow-[0_16px_40px_rgba(0,0,0,0.45)]",
        )}
      >
        {allowEmpty ? (
          <SelectItem
            value={APP_SELECT_EMPTY}
            className={cn(isHackathon && hackathonSelectItemClass)}
          >
            {emptyLabel}
          </SelectItem>
        ) : null}
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(isHackathon && hackathonSelectItemClass)}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const hackathonSelectItemClass =
  "items-start whitespace-normal py-2.5 pl-8 pr-3 text-left text-[13px] leading-snug text-[#dbe9f8] focus:bg-[#0d2550] focus:text-white data-[highlighted]:bg-[#0d2550] data-[highlighted]:text-white [&_svg]:mt-0.5";
