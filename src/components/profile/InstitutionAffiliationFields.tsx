"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Building2, Loader2, X } from "lucide-react";
import { userApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AffiliationValue } from "@/lib/affiliation-payload";

type Props = {
  value: AffiliationValue;
  onChange: (v: AffiliationValue) => void;
  disabled?: boolean;
  className?: string;
};

export function InstitutionAffiliationFields({
  value,
  onChange,
  disabled,
  className,
}: Props) {
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
      runSearch(searchQ);
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

  return (
    <div className={cn("space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4", className)}>
      <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Building2 className="h-4 w-4 shrink-0 text-[#7367F0]" />
        Institute / college / organization{" "}
        <span className="font-normal text-muted-foreground">(optional)</span>
      </Label>
      <div ref={wrapRef} className="relative space-y-3">
        <div className="relative">
          <Input
            placeholder="Search registered institutes…"
            value={searchQ}
            disabled={disabled}
            onChange={(e) => {
              setSearchQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="h-11 rounded-[0.625rem] border-border/60 bg-background pr-9 shadow-sm"
          />
          {loading && (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        {open && results.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-border/60 bg-popover text-sm shadow-lg">
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
        )}
        <p className="text-xs text-muted-foreground">
          Type at least 2 characters to search. Or enter a name below if yours is
          not listed.
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm font-medium text-foreground">
              Or type your institute name
            </Label>
            {value.affiliationInstitutionName.trim() ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={clearAffiliation}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            ) : null}
          </div>
          <Input
            placeholder="e.g. ABC College"
            value={value.affiliationInstitutionName}
            disabled={disabled}
            onChange={(e) => {
              onChange({
                affiliationInstitutionId: null,
                affiliationInstitutionName: e.target.value,
              });
            }}
            className="h-11 rounded-[0.625rem] border-border/60 bg-background shadow-sm"
          />
          {value.affiliationInstitutionId ? (
            <p className="text-xs text-muted-foreground">Matched from directory</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
