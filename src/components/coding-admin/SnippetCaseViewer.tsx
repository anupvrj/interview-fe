"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type {
  AdminCodingDesignMeta,
  AdminCodingFunctionCase,
  AdminCodingSnippetMeta,
} from "@/lib/api";
import { cn } from "@/lib/utils";

function FunctionCaseList({
  cases,
  variant,
}: Readonly<{
  cases: AdminCodingFunctionCase[];
  variant: "public" | "hidden";
}>) {
  if (cases.length === 0) {
    return <p className="text-sm text-muted-foreground">No test cases.</p>;
  }

  return (
    <div className="space-y-3">
      {cases.map((testCase, index) => (
        <div
          key={`${variant}-${index}`}
          className="space-y-2 rounded-md border border-border/80 bg-background p-3"
        >
          <div className="text-xs font-medium text-muted-foreground">
            Case #{index + 1}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Inputs</Label>
            <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-card px-3 py-2 font-mono text-xs">
              {JSON.stringify(testCase.inputs, null, 2)}
            </pre>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Expected output
            </Label>
            <pre className="mt-1 whitespace-pre-wrap break-words rounded-md border bg-card px-3 py-2 font-mono text-xs">
              {testCase.expectedOutput}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}

function DesignCaseList({
  cases,
  variant,
}: Readonly<{
  cases: AdminCodingDesignMeta["publicCases"];
  variant: "public" | "hidden";
}>) {
  if (cases.length === 0) {
    return <p className="text-sm text-muted-foreground">No test cases.</p>;
  }

  return (
    <div className="space-y-3">
      {cases.map((testCase, index) => (
        <div
          key={`${variant}-${index}`}
          className="space-y-2 rounded-md border border-border/80 bg-background p-3"
        >
          <div className="text-xs font-medium text-muted-foreground">
            Case #{index + 1}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Operations</Label>
            <pre className="mt-1 whitespace-pre-wrap break-words rounded-md border bg-card px-3 py-2 font-mono text-xs">
              {JSON.stringify(testCase.operations, null, 2)}
            </pre>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Args</Label>
            <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-card px-3 py-2 font-mono text-xs">
              {JSON.stringify(testCase.args, null, 2)}
            </pre>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Expected output
            </Label>
            <pre className="mt-1 whitespace-pre-wrap break-words rounded-md border bg-card px-3 py-2 font-mono text-xs">
              {testCase.expectedOutput}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}

interface SnippetCaseViewerProps {
  readonly snippetMeta?: AdminCodingSnippetMeta;
  readonly designMeta?: AdminCodingDesignMeta;
  readonly variant: "public" | "hidden";
}

export function SnippetCaseViewer({
  snippetMeta,
  designMeta,
  variant,
}: SnippetCaseViewerProps) {
  const isDesign = !!designMeta?.className;
  const caseCount = isDesign
    ? variant === "public"
      ? (designMeta?.publicCases?.length ?? 0)
      : (designMeta?.hiddenCases?.length ?? 0)
    : variant === "public"
      ? (snippetMeta?.publicCases?.length ?? 0)
      : (snippetMeta?.hiddenCases?.length ?? 0);

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
          {caseCount} case{caseCount === 1 ? "" : "s"}
        </Badge>
      </div>

      {isDesign ? (
        <DesignCaseList
          cases={
            variant === "public"
              ? (designMeta?.publicCases ?? [])
              : (designMeta?.hiddenCases ?? [])
          }
          variant={variant}
        />
      ) : (
        <FunctionCaseList
          cases={
            variant === "public"
              ? (snippetMeta?.publicCases ?? [])
              : (snippetMeta?.hiddenCases ?? [])
          }
          variant={variant}
        />
      )}

      {!isDesign && snippetMeta?.entryPoint ? (
        <p className="text-[11px] text-muted-foreground">
          Entry point:{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            {snippetMeta.entryPoint}()
          </code>
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
