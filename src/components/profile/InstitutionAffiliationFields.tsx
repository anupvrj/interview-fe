"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Building2, Check, Loader2, Minus, Plus, X } from "lucide-react";
import { userApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AffiliationValue } from "@/lib/affiliation-payload";

const inputClass =
  "h-11 rounded-[0.625rem] border-border/60 bg-card shadow-sm";

type Props = {
  value: AffiliationValue;
  onChange: (v: AffiliationValue) => void;
  disabled?: boolean;
  className?: string;
  /** When true, omits outer card chrome — for use inside FormSection on onboarding. */
  embedded?: boolean;
  /** Collapse fields behind a toggle; hidden by default unless a value is already set. */
  collapsible?: boolean;
  defaultExpanded?: boolean;
};

function FieldLabel({
  htmlFor,
  label,
  optional,
  hint,
}: Readonly<{
  htmlFor?: string;
  label: string;
  optional?: boolean;
  hint?: string;
}>) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-muted-foreground/80">(optional)</span>
        ) : null}
      </Label>
      {hint ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function InstitutionAffiliationFields({
  value,
  onChange,
  disabled,
  className,
  embedded = false,
  collapsible = false,
  defaultExpanded,
}: Readonly<Props>) {
  const hasSelection = Boolean(value.affiliationInstitutionName.trim());
  const [expanded, setExpanded] = useState(
    () => defaultExpanded ?? (collapsible ? hasSelection : true),
  );
  const [searchQ, setSearchQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ _id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await userApi.searchInstitutionsForAffiliation(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(searchQ);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQ, runSearch]);

  const selectInstitution = (r: { _id: string; name: string }) => {
    onChange({
      affiliationInstitutionId: r._id,
      affiliationInstitutionName: r.name,
    });
    setSearchQ("");
    setOpen(false);
    setResults([]);
  };

  const clearAffiliation = () => {
    onChange({
      affiliationInstitutionId: null,
      affiliationInstitutionName: "",
    });
    setSearchQ("");
    setResults([]);
  };

  const sectionHeader = (
    <div className="flex w-full items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
        <Building2 className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Institute affiliation{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Link your college, bootcamp, or organization
            </p>
            {collapsible && !expanded && hasSelection ? (
              <p className="mt-1.5 truncate text-xs font-medium text-[#7367F0]">
                {value.affiliationInstitutionName}
              </p>
            ) : null}
          </div>
          {collapsible ? (
            <button
              type="button"
              aria-expanded={expanded}
              aria-label={expanded ? "Hide institute fields" : "Add institute affiliation"}
              disabled={disabled}
              onClick={() => setExpanded((open) => !open)}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground transition-colors",
                "hover:border-[#7367F0]/40 hover:bg-[#7367F0]/[0.06] hover:text-[#7367F0]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7367F0] focus-visible:ring-offset-2",
                expanded && "border-[#7367F0]/40 bg-[#7367F0]/[0.08] text-[#7367F0]",
              )}
            >
              {expanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  const fields = (
    <div className="space-y-5">
      {/* Search directory */}
      <div ref={wrapRef} className="relative space-y-2">
        <FieldLabel
          htmlFor="institute-search"
          label="Search registered institute"
          hint="Type at least 2 characters to find your college, bootcamp, or organization."
        />
        <div className="relative">
          <Input
            id="institute-search"
            placeholder="e.g. IIT Delhi, Masai School…"
            value={searchQ}
            disabled={disabled}
            onChange={(e) => {
              setSearchQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className={cn(inputClass, "pr-9")}
          />
          {loading ? (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>
        {open && results.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-border/60 bg-card text-sm text-foreground shadow-lg">
            {results.map((r) => (
              <li key={r._id}>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left transition-colors hover:bg-muted"
                  onClick={() => selectInstitution(r)}
                >
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Selected from directory */}
      {value.affiliationInstitutionId && hasSelection ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#7367F0]/30 bg-[#7367F0]/[0.06] px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#7367F0]/15 text-[#7367F0]">
              <Check className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {value.affiliationInstitutionName}
              </p>
              <p className="text-[11px] text-muted-foreground">Matched from directory</p>
            </div>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={clearAffiliation}
            className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      ) : null}

      {/* Divider */}
      {!value.affiliationInstitutionId ? (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/80" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            or
          </span>
          <div className="h-px flex-1 bg-border/80" />
        </div>
      ) : null}

      {/* Manual entry — hidden when a directory match is active */}
      {!value.affiliationInstitutionId ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <FieldLabel
              htmlFor="institute-manual"
              label="Enter institute name manually"
              optional
              hint="Use this if your institute isn't listed above."
            />
            {hasSelection ? (
              <button
                type="button"
                disabled={disabled}
                onClick={clearAffiliation}
                className="inline-flex shrink-0 items-center gap-1 pt-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            ) : null}
          </div>
          <Input
            id="institute-manual"
            placeholder="e.g. ABC College"
            value={value.affiliationInstitutionName}
            disabled={disabled}
            onChange={(e) => {
              onChange({
                affiliationInstitutionId: null,
                affiliationInstitutionName: e.target.value,
              });
            }}
            className={inputClass}
          />
        </div>
      ) : null}
    </div>
  );

  if (embedded && !collapsible) {
    return <div className={className}>{fields}</div>;
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5",
        className,
      )}
    >
      {sectionHeader}
      {!collapsible || expanded ? (
        <div
          className={cn(
            "mt-4 space-y-4",
            collapsible && "border-t border-border/60 pt-4",
          )}
        >
          {fields}
        </div>
      ) : null}
    </div>
  );
}
