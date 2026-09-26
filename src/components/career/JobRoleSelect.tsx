"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Input } from "@/components/ui/input";
import {
  filterJobRoleSuggestions,
  isKnownJobRole,
} from "@/lib/career-catalog";
import { cn } from "@/lib/utils";
import {
  instituteInlineDropdownItemClass,
  instituteInlineDropdownListClass,
} from "@/components/institute/institute-inline-dropdown-styles";

type JobRoleSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  industry?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  suggestionLimit?: number;
};

export function JobRoleSelect({
  id,
  value,
  onChange,
  industry,
  disabled = false,
  placeholder = "Type or select a role",
  className,
  inputClassName,
  suggestionLimit = 10,
}: Readonly<JobRoleSelectProps>) {
  const safeValue = value ?? "";
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const suggestions = useMemo(
    () => filterJobRoleSuggestions(safeValue, industry, suggestionLimit),
    [safeValue, industry, suggestionLimit],
  );

  const openSuggestions = useCallback(() => {
    setOpen(true);
  }, []);

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

  const pickRole = useCallback(
    (role: string) => {
      onChange(role);
      setOpen(false);
    },
    [onChange],
  );

  const showSuggestions = open && !disabled && suggestions.length > 0;

  return (
    <div ref={wrapRef} className={cn("relative", open && "z-30", className)}>
      <Input
        id={id}
        value={safeValue}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={cn("h-11 w-full bg-card", inputClassName)}
        onChange={(event) => {
          onChange(event.target.value);
          openSuggestions();
        }}
        onFocus={openSuggestions}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onChange(safeValue.trim());
            setOpen(false);
          }
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {showSuggestions ? (
        <ul
          ref={listRef}
          data-institute-inline-dropdown
          data-job-role-dropdown
          role="listbox"
          className={instituteInlineDropdownListClass}
        >
          {suggestions.map((role) => (
            <li key={role}>
              <button
                type="button"
                role="option"
                className={instituteInlineDropdownItemClass}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  pickRole(role);
                }}
              >
                {role}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Clear catalog role when industry changes; keep custom free-text roles. */
export function shouldClearRoleOnIndustryChange(
  role: string,
  nextIndustry: string,
): boolean {
  const trimmedRole = role.trim();
  const trimmedIndustry = nextIndustry.trim();
  if (!trimmedRole || !trimmedIndustry) return false;
  if (isKnownJobRole(trimmedRole, trimmedIndustry)) return false;
  return isKnownJobRole(trimmedRole);
}
