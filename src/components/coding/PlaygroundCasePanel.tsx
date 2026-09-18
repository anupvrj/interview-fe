"use client";

import { cn } from "@/lib/utils";
import {
  formatPlaygroundValue,
  type PlaygroundCaseView,
} from "@/lib/coding-problem-mode";

interface PlaygroundCasePanelProps {
  readonly testCase: PlaygroundCaseView | null;
  readonly className?: string;
}

export function PlaygroundCasePanel({
  testCase,
  className,
}: PlaygroundCasePanelProps) {
  if (!testCase) {
    return (
      <p className={cn("text-sm text-[#9ca3af]", className)}>No testcase selected.</p>
    );
  }

  return (
    <div className={cn("space-y-3 overflow-y-auto", className)}>
      {testCase.kind === "stdin" ? (
        <Field label="stdin input" value={testCase.input} monospace />
      ) : null}

      {testCase.kind === "function"
        ? Object.entries(testCase.inputs).map(([name, value]) => (
            <Field
              key={name}
              label={`${name}`}
              value={formatPlaygroundValue(value)}
              monospace
            />
          ))
        : null}

      {testCase.kind === "design" ? (
        <>
          <Field
            label="operations"
            value={JSON.stringify(testCase.operations, null, 2)}
            monospace
          />
          <Field
            label="args"
            value={JSON.stringify(testCase.args, null, 2)}
            monospace
          />
        </>
      ) : null}

      <Field label="expected output" value={testCase.expectedOutput} monospace />
    </div>
  );
}

function Field({
  label,
  value,
  monospace = false,
}: Readonly<{
  label: string;
  value: string;
  monospace?: boolean;
}>) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
        {label}
      </label>
      <div
        className={cn(
          "rounded-md border border-[#3a3a3a] bg-[#282828] px-3 py-2 text-sm text-[#eff1f6] whitespace-pre-wrap break-words",
          monospace && "font-mono text-xs",
        )}
      >
        {value || "—"}
      </div>
    </div>
  );
}
