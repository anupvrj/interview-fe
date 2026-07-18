"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import {
  filterJobRoleSuggestions,
  isKnownJobRole,
} from "@/lib/career-catalog";
import { cn } from "@/lib/utils";

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

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
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
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
  });
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const suggestions = useMemo(
    () => filterJobRoleSuggestions(value, industry, suggestionLimit),
    [value, industry, suggestionLimit],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateDropdownPosition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const openSuggestions = useCallback(() => {
    updateDropdownPosition();
    setOpen(true);
  }, [updateDropdownPosition]);

  useEffect(() => {
    if (!open) return;

    updateDropdownPosition();

    const onScrollOrResize = () => updateDropdownPosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updateDropdownPosition]);

  useEffect(() => {
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
  }, []);

  const pickRole = (role: string) => {
    onChange(role);
    setOpen(false);
  };

  const showSuggestions = open && !disabled && suggestions.length > 0;

  const suggestionList =
    mounted && showSuggestions ? (
      <ul
        ref={listRef}
        className="fixed z-[10050] max-h-52 overflow-auto rounded-xl border border-border/60 bg-card text-sm text-foreground shadow-lg"
        style={{
          top: dropdownPos.top,
          left: dropdownPos.left,
          width: dropdownPos.width,
        }}
      >
        {suggestions.map((role) => (
          <li key={role}>
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left transition-colors hover:bg-muted"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pickRole(role)}
            >
              {role}
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <>
      <div ref={wrapRef} className={cn("relative", className)}>
        <Input
          ref={inputRef}
          id={id}
          value={value}
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
              onChange(value.trim());
              setOpen(false);
            }
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </div>
      {mounted && suggestionList
        ? createPortal(suggestionList, document.body)
        : null}
    </>
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
