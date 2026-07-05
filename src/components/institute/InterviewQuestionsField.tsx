"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { extractQuestionsFromFile } from "@/lib/extract-questions-from-file";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function InterviewQuestionsField({
  id,
  value,
  onChange,
  disabled,
  className,
}: Props) {
  const [parsing, setParsing] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileId = `${id}-questions-file`;

  const lines = useMemo(
    () =>
      value
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean),
    [value]
  );

  useEffect(() => {
    if (!value.trim()) setLoadedFileName(null);
  }, [value]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setParsing(true);
    try {
      const qs = await extractQuestionsFromFile(f);
      if (qs.length === 0) {
        alert(
          "No questions found. For Excel use column A (sheet 1); for CSV use one question per line."
        );
        return;
      }
      onChange(qs.join("\n"));
      setLoadedFileName(f.name);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not read file");
    } finally {
      setParsing(false);
    }
  };

  const statusId = `${id}-questions-status`;

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        id={fileId}
        type="file"
        accept=".csv,.txt,.xlsx,.xls,.xlsm,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled || parsing}
        onChange={handleFile}
      />
      <div
        className={cn(
          "rounded-xl border border-border/90 bg-gradient-to-b from-slate-50/90 to-card p-4 shadow-sm",
          (disabled || parsing) && "pointer-events-none opacity-60"
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-muted-foreground ring-1 ring-slate-200/80">
              <FileSpreadsheet className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <Label
                htmlFor={fileId}
                className="cursor-pointer text-sm font-medium text-foreground"
              >
                Import from CSV or Excel
              </Label>
              <p id={statusId} className="mt-1 text-sm text-muted-foreground">
                {loadedFileName ? (
                  <>
                    <span className="font-medium text-foreground">{loadedFileName}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {lines.length} question{lines.length === 1 ? "" : "s"}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    Choose a file to load your question list — or leave empty for AI-generated
                    questions.
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 border-slate-300 bg-card font-medium shadow-sm hover:bg-muted/20"
              disabled={disabled || parsing}
              onClick={() => fileInputRef.current?.click()}
              aria-describedby={statusId}
            >
              {parsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Choose file
                </>
              )}
            </Button>
            {lines.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 gap-1 text-muted-foreground"
                disabled={disabled || parsing}
                onClick={() => onChange("")}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {lines.length > 0 ? (
        <ol className="mt-3 max-h-48 list-decimal space-y-1 overflow-y-auto rounded-md border border-border bg-muted/25 py-2 pl-8 pr-3 text-sm text-foreground">
          {lines.map((line, i) => (
            <li key={`${i}-${line.slice(0, 40)}`} className="break-words pl-1">
              {line}
            </li>
          ))}
        </ol>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        CSV/TXT: one question per line. Excel: first sheet, column A, one question per row. A
        header row labeled Question is skipped.
      </p>
    </div>
  );
}
