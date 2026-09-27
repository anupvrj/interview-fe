"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FormField } from "@/components/app/FormField";
import { SearchInput } from "@/components/app/SearchInput";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { adminApi, systemDesignApi, type SystemDesignProblemSummary } from "@/lib/api";
import type { InstituteScheduleRoundType } from "@/lib/institute-schedule-round";
import { InstituteScheduleInterviewTypeField } from "@/components/institute/InstituteScheduleInterviewTypeField";
import { cn } from "@/lib/utils";

export { InstituteScheduleInterviewTypeField } from "@/components/institute/InstituteScheduleInterviewTypeField";

type CodingCatalogItem = {
  problemId: string;
  title: string;
  difficulty: string;
  categories: string[];
};

type Props = Readonly<{
  idPrefix: string;
  roundType: InstituteScheduleRoundType;
  onRoundTypeChange: (value: InstituteScheduleRoundType) => void;
  codingProblemIds: string[];
  onCodingProblemIdsChange: (ids: string[]) => void;
  systemDesignProblemId: string;
  onSystemDesignProblemIdChange: (id: string) => void;
  disabled?: boolean;
  /** When false, only coding / system design pickers (type chosen elsewhere). */
  showTypeSelector?: boolean;
}>;

const controlClass = "h-11 w-full border-border bg-card shadow-sm";

export function InstituteScheduleRoundFields({
  idPrefix,
  roundType,
  onRoundTypeChange,
  codingProblemIds,
  onCodingProblemIdsChange,
  systemDesignProblemId,
  onSystemDesignProblemIdChange,
  disabled,
  showTypeSelector = true,
}: Props) {
  const [codingSearch, setCodingSearch] = useState("");
  const [codingLoading, setCodingLoading] = useState(false);
  const [codingProblems, setCodingProblems] = useState<CodingCatalogItem[]>([]);

  const [sdSearch, setSdSearch] = useState("");
  const [sdLoading, setSdLoading] = useState(false);
  const [sdProblems, setSdProblems] = useState<SystemDesignProblemSummary[]>([]);

  const loadCodingCatalog = useCallback(async (search: string) => {
    const q = search.trim();
    if (!q) {
      setCodingProblems([]);
      setCodingLoading(false);
      return;
    }
    setCodingLoading(true);
    try {
      const problems = await adminApi.listCodingProblemsCatalog({
        search: q,
        limit: 40,
      });
      setCodingProblems(problems);
    } catch {
      setCodingProblems([]);
    } finally {
      setCodingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (roundType !== "coding_practice") return;
    const q = codingSearch.trim();
    if (!q) {
      setCodingProblems([]);
      setCodingLoading(false);
      return;
    }
    const t = window.setTimeout(() => {
      void loadCodingCatalog(codingSearch);
    }, 300);
    return () => window.clearTimeout(t);
  }, [roundType, codingSearch, loadCodingCatalog]);

  useEffect(() => {
    if (roundType !== "system_design") return;
    setSdLoading(true);
    systemDesignApi
      .listProblems()
      .then(setSdProblems)
      .catch(() => setSdProblems([]))
      .finally(() => setSdLoading(false));
  }, [roundType]);

  const filteredSd = useMemo(() => {
    const q = sdSearch.trim().toLowerCase();
    if (!q) return sdProblems;
    return sdProblems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.difficulty.toLowerCase().includes(q),
    );
  }, [sdProblems, sdSearch]);

  const toggleCoding = (problemId: string) => {
    if (disabled) return;
    if (codingProblemIds.includes(problemId)) {
      onCodingProblemIdsChange(codingProblemIds.filter((id) => id !== problemId));
      return;
    }
    onCodingProblemIdsChange([...codingProblemIds, problemId]);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showTypeSelector ? (
        <InstituteScheduleInterviewTypeField
          idPrefix={idPrefix}
          roundType={roundType}
          onRoundTypeChange={onRoundTypeChange}
          disabled={disabled}
          className="sm:col-span-2"
        />
      ) : null}

      {roundType === "coding_practice" ? (
        <FormField
          label="Coding problems"
          htmlFor={`${idPrefix}-coding-search`}
          required
          className="sm:col-span-2"
          hint="Search to find problems, then select one or more (order is preserved)."
        >
          <SearchInput
            id={`${idPrefix}-coding-search`}
            value={codingSearch}
            onChange={(e) => setCodingSearch(e.target.value)}
            placeholder="Search by title, id, or category…"
            disabled={disabled}
            containerClassName="mb-3 max-w-none w-full"
          />
          {codingSearch.trim() ? (
            <div className="max-h-56 overflow-y-auto rounded-md border border-border bg-muted/20">
              {codingLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading problems…
                </div>
              ) : codingProblems.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No matching active problems.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {codingProblems.map((p) => {
                    const checked = codingProblemIds.includes(p.problemId);
                    return (
                      <li key={p.problemId}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted/50",
                            checked && "bg-primary/5",
                          )}
                          onClick={() => toggleCoding(p.problemId)}
                          disabled={disabled}
                        >
                          <input
                            type="checkbox"
                            readOnly
                            checked={checked}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                            tabIndex={-1}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">
                            <span className="font-medium text-foreground">
                              {p.title}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {p.difficulty}
                              {p.categories?.length
                                ? ` · ${p.categories.slice(0, 3).join(", ")}`
                                : ""}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Type in the search box to browse the coding problem bank.
            </p>
          )}
          {codingProblemIds.length > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {codingProblemIds.length} selected
            </p>
          ) : null}
        </FormField>
      ) : null}

      {roundType === "system_design" ? (
        <FormField
          label="System design problem"
          htmlFor={`${idPrefix}-sd-search`}
          required
          className="sm:col-span-2"
          hint="Pick exactly one problem for this schedule."
        >
          <SearchInput
            id={`${idPrefix}-sd-search`}
            value={sdSearch}
            onChange={(e) => setSdSearch(e.target.value)}
            placeholder="Search by title or difficulty…"
            disabled={disabled}
            containerClassName="mb-3 max-w-none w-full"
          />
          <div className="max-h-56 overflow-y-auto rounded-md border border-border bg-muted/20">
            {sdLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading problems…
              </div>
            ) : filteredSd.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No problems match your search.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {filteredSd.map((p) => {
                  const selected = systemDesignProblemId === p.id;
                  return (
                    <li key={p.id}>
                      <Label
                        className={cn(
                          "flex cursor-pointer items-start gap-3 px-3 py-2.5 font-normal hover:bg-muted/50",
                          selected && "bg-primary/5",
                        )}
                      >
                        <input
                          type="radio"
                          name={`${idPrefix}-sd-problem`}
                          className="mt-1"
                          checked={selected}
                          onChange={() =>
                            onSystemDesignProblemIdChange(p.id)
                          }
                          disabled={disabled}
                        />
                        <span className="min-w-0 flex-1 text-sm">
                          <span className="font-medium text-foreground">
                            {p.title}
                          </span>
                          <span className="mt-0.5 block text-xs capitalize text-muted-foreground">
                            {p.difficulty}
                          </span>
                        </span>
                      </Label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </FormField>
      ) : null}
    </div>
  );
}
