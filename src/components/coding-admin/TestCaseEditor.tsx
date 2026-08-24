"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import type { AdminCodingTestCase } from "@/lib/api";
import { cn } from "@/lib/utils";
import { emptyTestCase } from "./form-utils";

interface TestCaseEditorProps {
  readonly label: string;
  readonly hint?: string;
  readonly variant?: "public" | "hidden";
  readonly cases: AdminCodingTestCase[];
  readonly onChange: (cases: AdminCodingTestCase[]) => void;
}

export function TestCaseEditor({
  label,
  hint,
  variant = "public",
  cases,
  onChange,
}: TestCaseEditorProps) {
  const update = (index: number, patch: Partial<AdminCodingTestCase>) => {
    onChange(
      cases.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  };

  const remove = (index: number) => {
    onChange(cases.filter((_, i) => i !== index));
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...cases];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    onChange(next);
  };

  const duplicate = (index: number) => {
    const copy = { ...cases[index]! };
    const next = [...cases];
    next.splice(index + 1, 0, copy);
    onChange(next);
  };

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border p-4",
        variant === "hidden"
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border bg-card/50",
      )}
    >
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {hint ? (
          <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>

      {cases.length === 0 ? (
        <p className="text-sm text-muted-foreground">No test cases yet.</p>
      ) : null}

      {cases.map((tc, i) => (
        <div
          key={`${variant}-${i}`}
          className="space-y-2 rounded-md border border-border/80 bg-background p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Case #{i + 1}
            </span>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => move(i, -1)}
                disabled={i === 0}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => move(i, 1)}
                disabled={i === cases.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => duplicate(i)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => remove(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Input (stdin)</Label>
              <textarea
                className="mt-1 min-h-[80px] w-full rounded-md border bg-card px-3 py-2 font-mono text-xs"
                value={tc.input}
                onChange={(e) => update(i, { input: e.target.value })}
                placeholder="1 2\n"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Expected output
              </Label>
              <textarea
                className="mt-1 min-h-[80px] w-full rounded-md border bg-card px-3 py-2 font-mono text-xs"
                value={tc.expectedOutput}
                onChange={(e) => update(i, { expectedOutput: e.target.value })}
                placeholder="3"
              />
            </div>
          </div>
          <AppSelect
            value={tc.compareMode ?? "trim"}
            onChange={(v) =>
              update(i, { compareMode: v as "exact" | "trim" })
            }
            options={[
              { value: "trim", label: "Trim whitespace" },
              { value: "exact", label: "Exact match" },
            ]}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...cases, emptyTestCase()])}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add test case
      </Button>
    </div>
  );
}
