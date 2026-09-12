"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CompanyTagInputProps {
  readonly value: string[];
  readonly onChange: (value: string[]) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function CompanyTagInput({
  value,
  onChange,
  placeholder = "Type company name and press Enter",
  disabled,
  className,
}: CompanyTagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    const exists = value.some((v) => v.toLowerCase() === tag.toLowerCase());
    if (exists) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(draft);
    }
    if (e.key === "Backspace" && !draft && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5",
        disabled && "opacity-60",
        className,
      )}
    >
      {value.map((tag, i) => (
        <Badge
          key={`${tag}-${i}`}
          variant="secondary"
          className="gap-1 pr-1 font-normal"
        >
          {tag}
          {!disabled ? (
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              className="rounded-sm hover:bg-muted"
              onClick={() => removeTag(i)}
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </Badge>
      ))}
      {!disabled ? (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) addTag(draft);
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="h-7 min-w-[120px] flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
        />
      ) : null}
    </div>
  );
}
