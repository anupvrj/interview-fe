"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import { cn } from "@/lib/utils";
import {
  CTC_UNIT_OPTIONS,
  type CtcUnit,
} from "@/lib/profile-compensation";

type ProfileCtcFieldProps = {
  id: string;
  label: string;
  amount: string;
  unit: CtcUnit;
  disabled?: boolean;
  placeholder?: string;
  fieldClassName: string;
  labelClassName: string;
  inputClassName: string;
  onAmountChange: (value: string) => void;
  onUnitChange: (value: CtcUnit) => void;
};

export function ProfileCtcField({
  id,
  label,
  amount,
  unit,
  disabled,
  placeholder = "e.g. 18",
  fieldClassName,
  labelClassName,
  inputClassName,
  onAmountChange,
  onUnitChange,
}: ProfileCtcFieldProps) {
  return (
    <div className={fieldClassName}>
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      <div className="flex min-w-0 gap-2">
        <Input
          id={id}
          type="number"
          min="0"
          step="0.1"
          inputMode="decimal"
          className={cn(inputClassName, "min-w-0 flex-1")}
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
        />
        <AppSelect
          id={`${id}-unit`}
          value={unit}
          onChange={(value) => onUnitChange(value === "inr" ? "inr" : "lpa")}
          options={CTC_UNIT_OPTIONS}
          disabled={disabled}
          className={cn(inputClassName, "w-[7.5rem] shrink-0")}
        />
      </div>
    </div>
  );
}
