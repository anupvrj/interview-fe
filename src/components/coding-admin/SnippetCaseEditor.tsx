"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type {
  AdminCodingDesignCase,
  AdminCodingDesignMeta,
  AdminCodingFunctionCase,
  AdminCodingSnippetMeta,
} from "@/lib/api";
import { cn } from "@/lib/utils";

function defaultValueForParamType(type: string): unknown {
  if (type === "ListNode[]") return [[]];
  if (type.endsWith("[][]")) return [[]];
  if (type.endsWith("[]")) return [];
  if (type === "integer" || type === "double") return 0;
  if (type === "boolean") return false;
  if (type === "string") return "";
  if (type === "ListNode" || type === "TreeNode" || type === "ListNodeRandom") {
    return [];
  }
  return null;
}

export function emptySnippetFunctionCase(
  params: AdminCodingSnippetMeta["params"],
): AdminCodingFunctionCase {
  const inputs: Record<string, unknown> = {};
  for (const param of params) {
    inputs[param.name] = defaultValueForParamType(param.type);
  }
  return { inputs, expectedOutput: "" };
}

export function emptySnippetDesignCase(): AdminCodingDesignCase {
  return {
    operations: ["Constructor"],
    args: [[]],
    expectedOutput: "[]",
  };
}

function CaseActions({
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}: Readonly<{
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}>) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onMoveUp}
        disabled={index === 0}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onMoveDown}
        disabled={index === total - 1}
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onDuplicate}
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function JsonField({
  label,
  value,
  onValidChange,
  minHeight = "min-h-[96px]",
}: Readonly<{
  label: string;
  value: unknown;
  onValidChange: (parsed: unknown) => void;
  minHeight?: string;
}>) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  const commit = (nextText: string) => {
    setText(nextText);
    try {
      const parsed = JSON.parse(nextText) as unknown;
      setError(null);
      onValidChange(parsed);
    } catch {
      setError("Invalid JSON");
    }
  };

  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <textarea
        className={cn(
          "mt-1 w-full rounded-md border bg-card px-3 py-2 font-mono text-xs",
          minHeight,
          error && "border-destructive",
        )}
        value={text}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => commit(text)}
      />
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function FunctionCaseEditor({
  cases,
  params,
  variant,
  onChange,
}: Readonly<{
  cases: AdminCodingFunctionCase[];
  params: AdminCodingSnippetMeta["params"];
  variant: "public" | "hidden";
  onChange: (cases: AdminCodingFunctionCase[]) => void;
}>) {
  const updateCase = (
    index: number,
    patch: Partial<AdminCodingFunctionCase>,
  ) => {
    onChange(cases.map((testCase, i) => (i === index ? { ...testCase, ...patch } : testCase)));
  };

  const removeCase = (index: number) => {
    onChange(cases.filter((_, i) => i !== index));
  };

  const moveCase = (index: number, dir: -1 | 1) => {
    const next = [...cases];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    onChange(next);
  };

  const duplicateCase = (index: number) => {
    const copy = structuredClone(cases[index]!);
    const next = [...cases];
    next.splice(index + 1, 0, copy);
    onChange(next);
  };

  return (
    <>
      {cases.length === 0 ? (
        <p className="text-sm text-muted-foreground">No test cases yet.</p>
      ) : null}

      {cases.map((testCase, index) => (
        <div
          key={`${variant}-fn-${index}`}
          className="space-y-2 rounded-md border border-border/80 bg-background p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Case #{index + 1}
            </span>
            <CaseActions
              index={index}
              total={cases.length}
              onMoveUp={() => moveCase(index, -1)}
              onMoveDown={() => moveCase(index, 1)}
              onDuplicate={() => duplicateCase(index)}
              onRemove={() => removeCase(index)}
            />
          </div>

          <JsonField
            key={`${variant}-inputs-${index}`}
            label={`Inputs (${params.map((p) => p.name).join(", ")})`}
            value={testCase.inputs}
            onValidChange={(inputs) => {
              if (inputs && typeof inputs === "object" && !Array.isArray(inputs)) {
                updateCase(index, {
                  inputs: inputs as AdminCodingFunctionCase["inputs"],
                });
              }
            }}
          />

          <div>
            <Label className="text-xs text-muted-foreground">
              Expected output
            </Label>
            <textarea
              className="mt-1 min-h-[56px] w-full rounded-md border bg-card px-3 py-2 font-mono text-xs"
              value={testCase.expectedOutput}
              onChange={(e) =>
                updateCase(index, { expectedOutput: e.target.value })
              }
              placeholder="[1,2,3]"
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([...cases, emptySnippetFunctionCase(params)])
        }
      >
        <Plus className="mr-1 h-4 w-4" />
        Add test case
      </Button>
    </>
  );
}

function DesignCaseEditor({
  cases,
  variant,
  onChange,
}: Readonly<{
  cases: AdminCodingDesignCase[];
  variant: "public" | "hidden";
  onChange: (cases: AdminCodingDesignCase[]) => void;
}>) {
  const updateCase = (index: number, patch: Partial<AdminCodingDesignCase>) => {
    onChange(cases.map((testCase, i) => (i === index ? { ...testCase, ...patch } : testCase)));
  };

  const removeCase = (index: number) => {
    onChange(cases.filter((_, i) => i !== index));
  };

  const moveCase = (index: number, dir: -1 | 1) => {
    const next = [...cases];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    onChange(next);
  };

  const duplicateCase = (index: number) => {
    const copy = structuredClone(cases[index]!);
    const next = [...cases];
    next.splice(index + 1, 0, copy);
    onChange(next);
  };

  return (
    <>
      {cases.length === 0 ? (
        <p className="text-sm text-muted-foreground">No test cases yet.</p>
      ) : null}

      {cases.map((testCase, index) => (
        <div
          key={`${variant}-design-${index}`}
          className="space-y-2 rounded-md border border-border/80 bg-background p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Case #{index + 1}
            </span>
            <CaseActions
              index={index}
              total={cases.length}
              onMoveUp={() => moveCase(index, -1)}
              onMoveDown={() => moveCase(index, 1)}
              onDuplicate={() => duplicateCase(index)}
              onRemove={() => removeCase(index)}
            />
          </div>

          <JsonField
            key={`${variant}-ops-${index}`}
            label="Operations"
            value={testCase.operations}
            onValidChange={(operations) => {
              if (Array.isArray(operations)) {
                updateCase(index, {
                  operations: operations as string[],
                });
              }
            }}
            minHeight="min-h-[72px]"
          />

          <JsonField
            key={`${variant}-args-${index}`}
            label="Args"
            value={testCase.args}
            onValidChange={(args) => {
              if (Array.isArray(args)) {
                updateCase(index, { args: args as unknown[][] });
              }
            }}
          />

          <div>
            <Label className="text-xs text-muted-foreground">
              Expected output
            </Label>
            <textarea
              className="mt-1 min-h-[56px] w-full rounded-md border bg-card px-3 py-2 font-mono text-xs"
              value={testCase.expectedOutput}
              onChange={(e) =>
                updateCase(index, { expectedOutput: e.target.value })
              }
              placeholder="[null,1,-1,null,null,3]"
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...cases, emptySnippetDesignCase()])}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add test case
      </Button>
    </>
  );
}

interface SnippetCaseEditorProps {
  readonly variant: "public" | "hidden";
  readonly snippetMeta?: AdminCodingSnippetMeta;
  readonly designMeta?: AdminCodingDesignMeta;
  readonly onSnippetMetaChange: (meta: AdminCodingSnippetMeta) => void;
  readonly onDesignMetaChange: (meta: AdminCodingDesignMeta) => void;
}

export function SnippetCaseEditor({
  variant,
  snippetMeta,
  designMeta,
  onSnippetMetaChange,
  onDesignMetaChange,
}: SnippetCaseEditorProps) {
  const isDesign = !!designMeta?.className;

  const cases = isDesign
    ? variant === "public"
      ? (designMeta?.publicCases ?? [])
      : (designMeta?.hiddenCases ?? [])
    : variant === "public"
      ? (snippetMeta?.publicCases ?? [])
      : (snippetMeta?.hiddenCases ?? []);

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border p-4",
        variant === "hidden"
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border bg-card/50",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-sm font-medium">
          {variant === "public"
            ? "Public tests (visible on Run)"
            : "Hidden tests (Submit only)"}
        </Label>
        <Badge variant="outline" className="font-normal">
          {isDesign ? "design" : "snippet"}
        </Badge>
        <Badge variant="secondary" className="font-normal">
          {cases.length} case{cases.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {isDesign && designMeta ? (
        <DesignCaseEditor
          cases={cases as AdminCodingDesignCase[]}
          variant={variant}
          onChange={(nextCases) =>
            onDesignMetaChange({
              ...designMeta,
              ...(variant === "public"
                ? { publicCases: nextCases }
                : { hiddenCases: nextCases }),
            })
          }
        />
      ) : snippetMeta ? (
        <FunctionCaseEditor
          cases={cases as AdminCodingFunctionCase[]}
          params={snippetMeta.params}
          variant={variant}
          onChange={(nextCases) =>
            onSnippetMetaChange({
              ...snippetMeta,
              ...(variant === "public"
                ? { publicCases: nextCases }
                : { hiddenCases: nextCases }),
            })
          }
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Missing snippet metadata for this problem.
        </p>
      )}

      {!isDesign && snippetMeta?.entryPoint ? (
        <p className="text-[11px] text-muted-foreground">
          Entry point:{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            {snippetMeta.entryPoint}()
          </code>
          {" · "}
          Params:{" "}
          {snippetMeta.params.map((p) => `${p.name}: ${p.type}`).join(", ")}
        </p>
      ) : null}
      {isDesign && designMeta?.className ? (
        <p className="text-[11px] text-muted-foreground">
          Class:{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            {designMeta.className}
          </code>
        </p>
      ) : null}
    </div>
  );
}
