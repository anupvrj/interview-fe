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
}: AppSelectProps) {
  const selectValue = allowEmpty && value === "" ? APP_SELECT_EMPTY : value;

  return (
    <Select
      modal={false}
      value={selectValue}
      onValueChange={(next) => onChange(next === APP_SELECT_EMPTY ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty ? <SelectItem value={APP_SELECT_EMPTY}>{emptyLabel}</SelectItem> : null}
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
