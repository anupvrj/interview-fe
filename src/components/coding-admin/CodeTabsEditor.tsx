"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import type { CodingLanguage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CODING_LANGUAGES } from "./form-utils";

interface CodeTabsEditorProps {
  readonly label: string;
  readonly hint?: string;
  readonly value: Partial<Record<CodingLanguage, string>>;
  readonly onChange: (v: Partial<Record<CodingLanguage, string>>) => void;
  readonly templateOptions?: Array<{ id: string; label: string }>;
  readonly onApplyTemplate?: (templateId: string) => void;
}

export function CodeTabsEditor({
  label,
  hint,
  value,
  onChange,
  templateOptions,
  onApplyTemplate,
}: CodeTabsEditorProps) {
  const [lang, setLang] = useState<CodingLanguage>("python");

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/50 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {hint ? (
            <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {templateOptions && templateOptions.length > 0 && onApplyTemplate ? (
          <div className="min-w-[200px]">
            <Label className="text-xs text-muted-foreground">
              Apply starter template
            </Label>
            <AppSelect
              value=""
              onChange={(v) => {
                if (v) onApplyTemplate(v);
              }}
              allowEmpty
              emptyLabel="Choose template…"
              placeholder="Choose template…"
              options={templateOptions.map((t) => ({
                value: t.id,
                label: t.label,
              }))}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1">
        {CODING_LANGUAGES.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLang(l.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              lang === l.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      <textarea
        className="min-h-[220px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs leading-relaxed"
        value={value[lang] ?? ""}
        onChange={(e) =>
          onChange({ ...value, [lang]: e.target.value })
        }
        spellCheck={false}
      />
    </div>
  );
}
