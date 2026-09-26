"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FormField } from "@/components/app/FormField";
import { Input } from "@/components/ui/input";
import {
  instituteInlineDropdownItemClass,
  instituteInlineDropdownListClass,
} from "@/components/institute/institute-inline-dropdown-styles";
import {
  INSTITUTE_SCHEDULE_ROUND_OPTIONS,
  type InstituteScheduleRoundType,
} from "@/lib/institute-schedule-round";
import { cn } from "@/lib/utils";

type Props = Readonly<{
  idPrefix: string;
  roundType: InstituteScheduleRoundType;
  onRoundTypeChange: (value: InstituteScheduleRoundType) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  inputClassName?: string;
}>;

export function InstituteScheduleInterviewTypeField({
  idPrefix,
  roundType,
  onRoundTypeChange,
  disabled,
  label = "Interview type",
  className,
  inputClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = INSTITUTE_SCHEDULE_ROUND_OPTIONS.find(
    (o) => o.value === roundType,
  );
  const displayLabel = selected?.label ?? "Select interview type";

  const openList = useCallback(() => {
    if (!disabled) setOpen(true);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;

    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        wrapRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = useCallback(
    (value: InstituteScheduleRoundType) => {
      onRoundTypeChange(value);
      setOpen(false);
    },
    [onRoundTypeChange],
  );

  const showList = open && !disabled;

  return (
    <FormField
      label={label}
      htmlFor={`${idPrefix}-round`}
      required
      className={cn(open && "relative z-30", className)}
      hint={
        selected?.description ??
        "What candidates run when they start from their dashboard."
      }
    >
      <div ref={wrapRef} className="relative">
        <Input
          id={`${idPrefix}-round`}
          readOnly
          value={displayLabel}
          disabled={disabled}
          autoComplete="off"
          aria-haspopup="listbox"
          aria-expanded={showList}
          className={cn("h-11 w-full cursor-pointer bg-card", inputClassName)}
          onClick={openList}
          onFocus={openList}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openList();
            }
          }}
        />
        {showList ? (
          <ul
            ref={listRef}
            data-institute-inline-dropdown
            role="listbox"
            aria-labelledby={`${idPrefix}-round`}
            className={instituteInlineDropdownListClass}
          >
            {INSTITUTE_SCHEDULE_ROUND_OPTIONS.map((opt) => {
              const isSelected = opt.value === roundType;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      instituteInlineDropdownItemClass,
                      isSelected && "bg-primary/5 font-medium",
                    )}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      pick(opt.value);
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </FormField>
  );
}
