"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AI_CONTENT_PROMPT_HINT,
  AI_CONTENT_PROMPT_PLACEHOLDER,
  AI_CONTENT_PROMPT_PRESETS,
} from "@/lib/ai-content-prompt";

interface AIContentPromptFieldProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
}

export function AIContentPromptField({
  value,
  onChange,
  id = "ai-content-prompt",
  disabled = false,
}: AIContentPromptFieldProps) {
  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          Your instructions{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {AI_CONTENT_PROMPT_HINT}
        </p>
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={AI_CONTENT_PROMPT_PLACEHOLDER}
        rows={3}
        disabled={disabled}
        className="min-h-[88px] resize-y text-sm"
      />
      <div className="flex flex-wrap gap-1.5">
        {AI_CONTENT_PROMPT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={disabled}
            onClick={() => onChange(preset.prompt)}
            className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
